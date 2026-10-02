import 'server-only';
import type { RowDataPacket } from 'mysql2';
import { getDb } from './index';
import type { EnquiryInput } from './schema';

export class EnquiryConflict extends Error {}

export async function saveEnquiry(row: EnquiryInput): Promise<{ replayed: boolean }> {
  const db = getDb();
  const values = [row.name, row.phone, row.email, row.suburb, row.service, row.property,
    row.size, row.date, row.time, row.details];
  const connection = await db.getConnection();
  try {
    // Commit explicitly, including on servers with a different autocommit default.
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO enquiries
       (id, created_at, name, phone, email, suburb, service, property, size, preferred_date, preferred_time, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, new Date().toISOString(), ...values],
    );
    await connection.commit();
    return { replayed: false };
  } catch (error) {
    await connection.rollback();
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY')) throw error;
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT name, phone, email, suburb, service, property, size, preferred_date, preferred_time, details
       FROM enquiries WHERE id = ?`, [row.id],
    );
    await connection.commit();
    const keys = ['name', 'phone', 'email', 'suburb', 'service', 'property', 'size', 'preferred_date', 'preferred_time', 'details'];
    if (rows.length !== 1 || !keys.every((key, index) => (rows[0][key] ?? '') === values[index])) {
      throw new EnquiryConflict('ENQUIRY_RETRY_CONFLICT');
    }
    return { replayed: true };
  } finally {
    connection.release();
  }
}
