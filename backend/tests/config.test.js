import { it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const appUrl = new URL('../src/app.js', import.meta.url).href;
it.each(['', 'development_secret_change_me', 'replace_with_a_long_random_secret'])('fails closed for missing/example JWT configuration: %s', secret => {
  const directory = mkdtempSync(join(tmpdir(), 'taskflow-config-'));
  try {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(appUrl)})`], {
      cwd: directory, env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: secret }, encoding: 'utf8',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(secret ? 'JWT_SECRET must be a unique random secret' : 'JWT_SECRET is required');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
