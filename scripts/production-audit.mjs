// Builds and exercises a local production artifact against an isolated database.
// AUDIT_PROJECT_DIR can point to a clean installation of this repository.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const project = resolve(process.env.AUDIT_PROJECT_DIR || dirname(fileURLToPath(import.meta.url)) + '/..');
const { MongoMemoryServer } = await import(pathToFileURL(resolve(project, 'backend/node_modules/mongodb-memory-server/index.js')));
const db = await MongoMemoryServer.create();
const children = [];
const previewPort = process.env.AUDIT_PREVIEW_PORT || '5174';
const previewURL = `http://127.0.0.1:${previewPort}`;
function start(command, args, cwd, env = {}) {
  const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit', detached: true });
  children.push(child);
  return child;
}
function completed(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Command exited ${code}`)));
  });
}
async function ready(url, child) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited before readiness: ${url}`);
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Readiness timeout: ${url}`);
}
try {
  await completed(start('npm', ['run', 'build'], resolve(project, 'frontend'), { VITE_API_URL: 'http://localhost:5055/api' }));
  const api = start('npm', ['start'], resolve(project, 'backend'), {
    NODE_ENV: 'production', PORT: '5055', MONGODB_URI: db.getUri('production_browser_audit'),
    JWT_SECRET: randomBytes(32).toString('hex'), JWT_EXPIRES_IN: '1d', CLIENT_URL: previewURL,
  });
  await ready('http://localhost:5055/api/health', api);
  const preview = start('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', previewPort, '--strictPort'], resolve(project, 'frontend'));
  await ready(previewURL, preview);
  // Run the scripts from this checkout so they can audit a clean source copy.
  for (const script of ['browser-audit.cjs', 'browser-states-audit.cjs', 'browser-profile-mobile.cjs']) {
    await completed(start(process.execPath, [resolve(dirname(fileURLToPath(import.meta.url)), script)], project, { AUDIT_URL: previewURL }));
  }
  console.log('Production artifact browser audit passed.');
} finally {
  for (const child of children) {
    if (child.exitCode === null) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }
  }
  await db.stop();
}
