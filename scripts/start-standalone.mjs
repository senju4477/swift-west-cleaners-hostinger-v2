import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

const root = fileURLToPath(new URL('../', import.meta.url));
nextEnv.loadEnvConfig(root, false);
process.env.NODE_ENV = 'production';
process.env.HOSTNAME = '0.0.0.0';
process.env.PORT ??= '3000';
if (!/^\d+$/.test(process.env.PORT) || Number(process.env.PORT) < 1 || Number(process.env.PORT) > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}
const server = new URL('../.next/standalone/server.js', import.meta.url);
try {
  await access(server);
} catch {
  throw new Error('Production server is missing. Run npm run build first.');
}
await import(server.href);
