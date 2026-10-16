// Redacted filesystem scan. This is not an exhaustive secret detector or a history scan.
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const knownSecrets = [], environments = [], findings = [];
for (const name of ['backend/.env', 'frontend/.env']) {
  let content;
  try { content = readFileSync(join(root, name), 'utf8'); } catch { continue; }
  const values = Object.fromEntries(content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#') && line.includes('=')).map(line => {
    const index = line.indexOf('=');
    return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
  }));
  const placeholder = /replace_with|change_me|development_secret/.test(values.JWT_SECRET || '');
  environments.push({ file: name, variableNames: Object.keys(values).sort(), jwtConfigured: !!values.JWT_SECRET, jwtIsPlaceholder: placeholder, jwtAtLeast32Characters: (values.JWT_SECRET || '').length >= 32, permissions: (statSync(join(root, name)).mode & 0o777).toString(8) });
  if (placeholder) findings.push({ file: name, kind: 'placeholder-jwt-secret' });
  for (const [key, value] of Object.entries(values)) {
    if (/SECRET|PASSWORD|TOKEN|KEY/.test(key) && value.length >= 12 && !/replace_with|change_me/.test(value)) knownSecrets.push({ key, value });
  }
}
let scanned = 0;
function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', 'audit-results'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { scan(path); continue; }
    if (!entry.isFile() || (entry.name.startsWith('.env') && entry.name !== '.env.example') || !/\.(?:js|jsx|cjs|mjs|json|md|css|html)$/.test(entry.name) && entry.name !== '.env.example') continue;
    const content = readFileSync(path, 'utf8'); scanned++;
    for (const [kind, pattern] of [
      ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
      ['credentialed-mongodb-uri', /mongodb(?:\+srv)?:\/\/[^\s/@:]+:[^\s/@]+@/],
      ['github-token', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
    ]) if (pattern.test(content)) findings.push({ file: relative(root, path), kind });
    for (const { key, value } of knownSecrets) if (content.includes(value)) findings.push({ file: relative(root, path), kind: 'matches-local-secret', key });
  }
}
scan(root);
const paths = ['.env', 'backend/.env', 'frontend/.env', 'backend/.env.production', 'frontend/.env.local', 'backend/.env.example', 'frontend/.env.example'];
const temporary = mkdtempSync(join(tmpdir(), 'taskflow-ignore-audit-'));
const ignoreRules = [];
try {
  writeFileSync(join(temporary, '.gitignore'), readFileSync(join(root, '.gitignore')));
  const initialized = spawnSync('git', ['init', '-q', temporary]);
  if (initialized.status !== 0) throw new Error('Unable to initialize isolated ignore-rule check');
  for (const path of paths) {
    const result = spawnSync('git', ['-C', temporary, 'check-ignore', '--no-index', path]);
    if (![0, 1].includes(result.status)) throw new Error('Ignore-rule check failed');
    ignoreRules.push({ path, ignored: result.status === 0 });
  }
} finally { rmSync(temporary, { recursive: true, force: true }); }
const git = spawnSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
const trackedEnvironmentFiles = git.status === 0 ? spawnSync('git', ['-C', root, 'ls-files', '--', '.env', '**/.env', '**/.env.*'], { encoding: 'utf8' }).stdout.trim().split('\n').filter(name => name && !name.endsWith('.env.example')) : null;
console.log(JSON.stringify({ scope: 'current source, examples and built frontend; redacted matching against local secrets; exact ignore rules', filesScanned: scanned, environments, findings, ignoreRules, gitMetadataAvailable: git.status === 0, trackedEnvironmentFiles, historyScanned: false }, null, 2));
if (findings.length || ignoreRules.some(({ path, ignored }) => ignored === path.endsWith('.env.example')) || trackedEnvironmentFiles?.length) process.exitCode = 1;
