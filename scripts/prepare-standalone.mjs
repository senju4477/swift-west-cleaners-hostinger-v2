import { access, cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, '.next/standalone');
await access(resolve(output, 'server.js'));
await access(resolve(root, '.next/static'));
await mkdir(resolve(output, '.next'), { recursive: true });
await rm(resolve(output, '.next/static'), { recursive: true, force: true });
await cp(resolve(root, '.next/static'), resolve(output, '.next/static'), { recursive: true });
await rm(resolve(output, 'public'), { recursive: true, force: true });
let publicExists = true;
try {
  await access(resolve(root, 'public'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  publicExists = false;
}
if (publicExists) await cp(resolve(root, 'public'), resolve(output, 'public'), { recursive: true });
console.log('Standalone server and static assets are ready.');
