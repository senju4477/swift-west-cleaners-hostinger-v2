import 'server-only';
import mysql, { type Pool } from 'mysql2/promise';

let pool: Pool | undefined;

// No connection or schema change occurs during module evaluation or a build.
export function getDb(): Pool {
  if (pool) return pool;
  for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
    if (!process.env[key]) throw new Error('DATABASE_NOT_CONFIGURED');
  }
  const port = Number(process.env.DB_PORT || '3306');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DATABASE_NOT_CONFIGURED');
  const ca = process.env.DB_SSL_CA?.replace(/\\n/g, '\n');
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60000,
    queueLimit: 20,
    connectTimeout: 5000,
    ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
  });
  return pool;
}
