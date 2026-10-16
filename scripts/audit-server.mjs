// Isolated browser-audit server. Never connects to the application's configured database.
import { randomBytes } from 'node:crypto';
import mongoose from '../backend/node_modules/mongoose/index.js';
import { MongoMemoryServer } from '../backend/node_modules/mongodb-memory-server/index.js';
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://127.0.0.1:5174';
const db = await MongoMemoryServer.create();
await mongoose.connect(db.getUri('browser_audit'));
const { default: app } = await import('../backend/src/app.js');
const server = app.listen(5055, () => console.log('Isolated audit API on 5055'));
process.on('SIGTERM',async()=>{server.close();await mongoose.disconnect();await db.stop();process.exit(0);});
