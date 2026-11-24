import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontend = resolve(root, 'frontend');
dotenv.config({ path: resolve(root, '.env') });

const nextCli = [
  resolve(frontend, 'node_modules/next/dist/bin/next'),
  resolve(root, 'node_modules/next/dist/bin/next'),
].find(existsSync);
if (!nextCli) throw new Error('Next.js was not found. Run npm install from the project root.');

const result = spawnSync(process.execPath, [nextCli, 'build'], {
  cwd: frontend,
  env: { ...process.env, NEXT_DIST_DIR: '.next-prod', API_ORIGIN: process.env.API_ORIGIN || 'http://localhost:4000' },
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
