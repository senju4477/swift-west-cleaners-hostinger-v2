import { EnquiryConflict, saveEnquiry } from '@/db/enquiries';
import { services } from '@/app/content';
import type { EnquiryInput } from '@/db/schema';

export const runtime = 'nodejs';
const LIMIT = 15000;
const fields = ['name', 'phone', 'email', 'suburb', 'service', 'property', 'size', 'date', 'time', 'details', 'website'] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const response = (body: object, status: number) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
});

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.origin !== origin) return false;
    // Hostinger terminates HTTPS at its proxy; compare the browser's host with the
    // request Host without requiring the internal Node connection to use HTTPS.
    return parsed.host === (req.headers.get('host') || new URL(req.url).host);
  } catch {
    return false;
  }
}

function validDate(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

async function readBody(req: Request): Promise<string | null> {
  if (Number(req.headers.get('content-length') || 0) > LIMIT) return null;
  const reader = req.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > LIMIT) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return response({ error: 'Please send your enquiry from this website.' }, 403);
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return response({ error: 'Invalid request.' }, 415);
  }
  let body: unknown;
  try {
    const raw = await readBody(req);
    if (raw === null) return response({ error: 'Your enquiry is too long.' }, 413);
    body = JSON.parse(raw);
  } catch {
    return response({ error: 'Please check the form fields.' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return response({ error: 'Please check the form fields.' }, 400);
  const input = body as Record<string, unknown>;
  const data: Record<(typeof fields)[number], string> = {} as Record<(typeof fields)[number], string>;
  for (const key of fields) {
    if (input[key] != null && typeof input[key] !== 'string') return response({ error: 'Please check the form fields.' }, 400);
    data[key] = typeof input[key] === 'string' ? input[key].trim() : '';
  }
  if (data.website) return response({ error: 'Unable to accept this enquiry.' }, 400);
  if (!data.name || data.name.length > 100 || !data.suburb || data.suburb.length > 100 ||
      !/^[+0-9 ()-]{8,30}$/.test(data.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 150 ||
      ![...services.map(service => service.name), 'Other'].includes(data.service) || data.details.length > 2000 ||
      data.property.length > 100 || data.size.length > 80) {
    return response({ error: 'Please check your name, contact details, suburb and cleaning service.' }, 400);
  }
  if (!validDate(data.date) || (data.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time))) {
    return response({ error: 'Please check your preferred date and time.' }, 400);
  }
  const key = req.headers.get('idempotency-key');
  if (key && !uuid.test(key)) return response({ error: 'Please refresh the page and try again.' }, 400);
  const id = key?.toLowerCase() || crypto.randomUUID();
  try {
    const { replayed } = await saveEnquiry({ ...data, id } as EnquiryInput);
    return response({ reference: 'SW-' + id.slice(0, 8).toUpperCase() }, replayed ? 200 : 201);
  } catch (error) {
    if (error instanceof EnquiryConflict) return response({ error: 'This enquiry changed during a retry. Please submit it again.' }, 409);
    // Never log SQL, parameters, customer details, connection strings, or passwords.
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const safeCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE', 'ER_CON_COUNT_ERROR'];
    console.error('Quote storage unavailable:', safeCodes.includes(code) ? code : 'DATABASE_UNAVAILABLE');
    return response({ error: 'We couldn’t save your enquiry just now. Your details are still here — please try again.' }, 503);
  }
}
