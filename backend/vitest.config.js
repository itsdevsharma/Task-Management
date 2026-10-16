import { defineConfig } from 'vitest/config';
import { randomBytes } from 'node:crypto';
export default defineConfig({ test: { env: { JWT_SECRET: randomBytes(32).toString('hex'), NODE_ENV: 'test' } } });
