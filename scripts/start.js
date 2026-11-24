import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontend = resolve(root, 'frontend');
const backend = resolve(root, 'backend');
dotenv.config({ path: resolve(root, '.env') });

const frontendPort = Number(process.env.WEB_PORT || 3000);
const backendPort = Number(process.env.PORT || 4000);

async function canBind(port, host, ipv6Only = false) {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.once('error', error => error.code === 'EADDRINUSE' ? resolvePort(false) : reject(error));
    probe.listen({ port, host, ipv6Only }, () => probe.close(() => resolvePort(true)));
  });
}

async function assertPortAvailable(port) {
  const free = await canBind(port, '0.0.0.0') && await canBind(port, '::', false);
  if (!free) throw new Error(`Port ${port} is already in use. Stop the other app instance before running npm start.`);
}

await assertPortAvailable(backendPort);
await assertPortAvailable(frontendPort);

const nextCli = [
  resolve(frontend, 'node_modules/next/dist/bin/next'),
  resolve(root, 'node_modules/next/dist/bin/next'),
].find(existsSync);
if (!nextCli) throw new Error('Next.js was not found. Run npm install from the project root.');

const commonEnv = { ...process.env };
const api = spawn(process.execPath, ['server.js'], {
  cwd: backend,
  env: { ...commonEnv, PORT: String(backendPort), CLIENT_ORIGIN: `http://localhost:${frontendPort}` },
  stdio: 'inherit',
});
const web = spawn(process.execPath, [nextCli, 'start', '--hostname', '0.0.0.0', '--port', String(frontendPort)], {
  cwd: frontend,
  env: { ...commonEnv, PORT: String(frontendPort), API_ORIGIN: `http://localhost:${backendPort}`, NEXT_DIST_DIR: '.next-prod' },
  stdio: 'inherit',
});

console.log(`Frontend: http://localhost:${frontendPort}`);
console.log(`Backend API: http://localhost:${backendPort}`);

let stopping = false;
function stopChild(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}
function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  stopChild(api);
  stopChild(web);
  process.exitCode = code;
}

for (const child of [api, web]) {
  child.once('error', error => { console.error(error.message); shutdown(1); });
  child.once('exit', code => { if (!stopping) shutdown(code || 0); });
}
process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));
