import { MongoMemoryServer } from '../backend/node_modules/mongodb-memory-server/index.js';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const db=await MongoMemoryServer.create();
const server=spawn(process.execPath,['src/server.js'],{cwd:new URL('../backend/',import.meta.url),env:{...process.env,NODE_ENV:'production',MONGODB_URI:db.getUri('production_smoke'),JWT_SECRET:randomBytes(32).toString('hex'),PORT:'5056'},stdio:['ignore','pipe','pipe']});
try {
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Startup timeout')),10000);server.stdout.on('data',d=>{if(d.toString().includes('Server running')){clearTimeout(timer);resolve();}});server.on('exit',code=>reject(new Error(`Server exited ${code}`)));});
 const response=await fetch('http://localhost:5056/api/health');assert.equal(response.status,200);assert.equal((await response.json()).success,true);
 console.log('Production NODE_ENV server startup + health endpoint passed (isolated MongoDB).');
} finally {server.kill('SIGTERM');await db.stop();}
