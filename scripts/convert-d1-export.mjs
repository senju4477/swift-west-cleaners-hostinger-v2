import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [input, output] = process.argv.slice(2);
if (!input || !output || resolve(input) === resolve(output)) {
  throw new Error('Usage: node scripts/convert-d1-export.mjs INPUT.json OUTPUT.sql (different paths required)');
}
const source = JSON.parse(await readFile(input, 'utf8'));
if (!Array.isArray(source)) throw new Error('Input must be an array of complete enquiry rows.');
const columns = ['id', 'created_at', 'name', 'phone', 'email', 'suburb', 'service', 'property', 'size', 'preferred_date', 'preferred_time', 'details'];
const required = new Set(columns.slice(0, 7));
const seen = new Set();
const statements = [];
for (const [index, row] of source.entries()) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error(`Invalid row at index ${index}.`);
  const values = columns.map(column => {
    if (!Object.hasOwn(row, column)) throw new Error(`Missing ${column} at index ${index}; partial exports are not accepted.`);
    const value = row[column];
    if (value === null && !required.has(column)) return 'NULL';
    if (typeof value !== 'string') throw new Error(`Invalid ${column} at index ${index}.`);
    const bytes = Buffer.from(value, 'utf8');
    if ((column === 'id' && (!value || [...value].length > 191)) ||
        (column === 'created_at' && [...value].length > 40) || bytes.length > 65535) {
      throw new Error(`Oversized ${column} at index ${index}; nothing is truncated.`);
    }
    return `CONVERT(X'${bytes.toString('hex')}' USING utf8mb4)`;
  });
  if (seen.has(row.id)) throw new Error(`Duplicate source ID at index ${index}.`);
  seen.add(row.id);
  const identical = columns.map(column => `BINARY enquiries.${column} <=> BINARY VALUES(${column})`).join(' AND ');
  statements.push(`INSERT INTO enquiries (${columns.join(', ')}) VALUES (${values.join(', ')})\nON DUPLICATE KEY UPDATE id = IF(${identical}, enquiries.id, NULL);`);
}
const sql = [
  '-- PRIVATE CUSTOMER EXPORT: never commit, share publicly, or put in a delivery archive.',
  `-- Source rows: ${source.length}. Exact duplicate rows are retryable; conflicting IDs fail.`,
  '-- Import only after schema.mysql.sql into the separate new database. Stop on any error.',
  'SET NAMES utf8mb4;',
  'SET @previous_import_sql_mode = @@SESSION.sql_mode;',
  "SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION';",
  'START TRANSACTION;',
  ...statements,
  'COMMIT;',
  'SET SESSION sql_mode = @previous_import_sql_mode;',
  `-- Expected transferred rows: ${source.length}. Verify counts and all fields before cutover.`,
].join('\n\n') + '\n';
await writeFile(output, sql, { mode: 0o600, flag: 'wx' });
console.log(`Converted ${source.length} rows. Private SQL written without overwriting an existing file.`);
