import { beforeAll, afterAll, beforeEach, it, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
let db, user, other, token;
beforeAll(async () => { db = await MongoMemoryServer.create(); await mongoose.connect(db.getUri()); await User.init(); });
afterAll(async () => { await mongoose.disconnect(); await db.stop(); });
beforeEach(async () => {
  await User.deleteMany({});
  [user, other] = await User.create([{name:'Profile User',email:'profile@example.com',password:'test-hash'},{name:'Other User',email:'other@example.com',password:'test-hash'}]);
  token = jwt.sign({sub:user.id},process.env.JWT_SECRET,{expiresIn:'1h'});
});
it('requires authentication for reading and editing profiles',async()=>{
  expect((await request(app).get('/api/auth/me')).status).toBe(401);
  expect((await request(app).put('/api/auth/me').send({name:'Changed'})).status).toBe(401);
});
it('saves only the authenticated user profile, persists optional fields, and excludes hashes',async()=>{
 const fields={name:'Updated User',email:'UPDATED@example.com',phone:'+91 12345 67890',location:'Mumbai',jobTitle:'Developer',bio:'Building useful things.'};
 const res=await request(app).put('/api/auth/me').set('Authorization',`Bearer ${token}`).send({...fields,_id:other.id,userId:other.id,password:'malicious-change',role:'admin'});
 expect(res.status).toBe(200);expect(res.body.data.password).toBeUndefined();expect(res.body.data._id).toBe(user.id);
 expect(res.body.data.email).toBe('updated@example.com');
 const stored=await User.findById(user.id);expect(stored.bio).toBe(fields.bio);expect(stored.password).toBe('test-hash');
 expect((await User.findById(other.id)).name).toBe('Other User');
 const read=await request(app).get('/api/auth/me').set('Authorization',`Bearer ${token}`);
 expect(read.body.data.location).toBe('Mumbai');expect(read.body.data.password).toBeUndefined();
 const clear=await request(app).put('/api/auth/me').set('Authorization',`Bearer ${token}`).send({bio:''});expect(clear.body.data.bio).toBe('');
});
it.each([{name:''},{name:'X'},{email:'bad'},{bio:'x'.repeat(601)},{phone:{}},{location:null}])('rejects invalid profile input %j',async body=>{
 const res=await request(app).put('/api/auth/me').set('Authorization',`Bearer ${token}`).send(body);
 expect(res.status).toBe(400);expect((await User.findById(user.id)).name).toBe('Profile User');
});
it('handles duplicate email without altering the original profile',async()=>{
 const res=await request(app).put('/api/auth/me').set('Authorization',`Bearer ${token}`).send({email:other.email});
 expect(res.status).toBe(409);expect((await User.findById(user.id)).email).toBe(user.email);
});
