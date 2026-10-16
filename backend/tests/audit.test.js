import { beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Task from '../src/models/Task.js';
let db, user, other, token;
const auth = () => ({ Authorization: `Bearer ${token}` });
beforeAll(async () => { db = await MongoMemoryServer.create(); await mongoose.connect(db.getUri()); });
beforeEach(async () => {
  await Promise.all([Task.deleteMany({}), User.deleteMany({})]);
  [user, other] = await User.create([{name:'Audit User',email:'audit@example.com',password:'unused-hash'}, {name:'Other User',email:'other@example.com',password:'unused-hash'}]);
  token = jwt.sign({sub:user.id},process.env.JWT_SECRET,{expiresIn:'1h'});
});
afterAll(async () => { await mongoose.disconnect(); await db.stop(); });
it('serves health and rejects unknown routes and malformed JSON', async () => {
  expect((await request(app).get('/api/health')).status).toBe(200);
  expect((await request(app).get('/api/missing')).status).toBe(404);
  expect((await request(app).post('/api/auth/login').set('Content-Type','application/json').send('{')).status).toBe(400);
});
it.each([{title:'x'.repeat(121)}, {title:'Valid',description:'x'.repeat(2001)}, {title:null}, {title:{}}, {title:'Valid',dueDate:'invalid'}, {title:'Valid',priority:'invalid'}, {title:'Valid',status:'invalid'}])('rejects invalid create and update input %j', async body => {
  const task = await Task.create({title:'Original',userId:user._id});
  expect((await request(app).post('/api/tasks').set(auth()).send(body)).status).toBe(400);
  expect((await request(app).put(`/api/tasks/${task.id}`).set(auth()).send(body)).status).toBe(400);
  expect((await Task.findById(task.id)).title).toBe('Original');
});
it.each(['search[$ne]=x','status[$ne]=completed','page=1.5','limit=Infinity','page=-1','status=invalid','order=invalid'])('rejects malformed query %s', async query => {
 expect((await request(app).get(`/api/tasks?${query}`).set(auth())).status).toBe(400);
});
it('checks exact query order, page boundaries, escaped search, stats and ownership against MongoDB', async () => {
 await Task.insertMany([
  {title:'Report [a]',status:'pending',priority:'high',dueDate:'2026-10-20',userId:user._id,createdAt:'2026-01-01'},
  {title:'Report B',status:'completed',priority:'low',dueDate:'2026-10-21',userId:user._id,createdAt:'2026-01-02'},
  {title:'Report C',status:'in-progress',priority:'high',dueDate:'2026-10-22',userId:user._id,createdAt:'2026-01-03'},
  {title:'Report secret',status:'pending',priority:'high',userId:other._id}
 ]);
 const get = async q => { const res = await request(app).get(`/api/tasks${q}`).set(auth()); expect(res.status).toBe(200); return res.body; };
 expect((await get('?search=%5Ba%5D')).data.map(t=>t.title)).toEqual(['Report [a]']);
 expect((await get('?status=pending&priority=high&search=report')).data.map(t=>t.title)).toEqual(['Report [a]']);
 for (const sortBy of ['createdAt','dueDate']) for(const order of ['asc','desc']) {
  const expected=await Task.find({userId:user._id}).sort({[sortBy]:order==='asc'?1:-1,_id:order==='asc'?1:-1}).lean();
  for(let page=1;page<=3;page++) {
   const result=await get(`?sortBy=${sortBy}&order=${order}&page=${page}&limit=1`);
   expect(result.data.map(t=>t._id)).toEqual([expected[page-1]._id.toString()]);
   expect(result.pagination).toEqual({page,limit:1,totalTasks:3,totalPages:3});
  }
 }
 const stats=await get('/stats');
 expect(stats.data.total).toBe(await Task.countDocuments({userId:user._id}));
 for(const [key,status] of Object.entries({pending:'pending',inProgress:'in-progress',completed:'completed'})) expect(stats.data[key]).toBe(await Task.countDocuments({userId:user._id,status}));
 const task=await Task.findOne({userId:other._id});
 for(const method of ['get','put','delete']) expect((await request(app)[method](`/api/tasks/${task.id}`).set(auth()).send({title:'hacked',userId:user.id})).status).toBe(404);
 expect((await Task.findById(task.id)).title).toBe('Report secret');
});
it('ignores owner reassignment and clears due dates', async () => {
 const res=await request(app).post('/api/tasks').set(auth()).send({title:'Owned',userId:other.id,dueDate:'2026-10-20'});
 expect(res.body.data.userId).toBe(user.id);
 const updated=await request(app).put(`/api/tasks/${res.body.data._id}`).set(auth()).send({userId:other.id,dueDate:null});
 expect(updated.body.data.userId).toBe(user.id); expect(updated.body.data.dueDate).toBeNull();
});
it('documents stateless logout behavior and rejects deleted users', async () => {
 expect((await request(app).post('/api/auth/logout')).status).toBe(200);
 expect((await request(app).get('/api/tasks').set(auth())).status).toBe(200);
 await User.findByIdAndDelete(user.id);
 expect((await request(app).get('/api/tasks').set(auth())).status).toBe(401);
});
it.each([{name:' ',email:'x@example.com',password:'long-password'}, {name:'A',email:'x@example.com',password:'long-password'}, {name:{},email:'x@example.com',password:'long-password'}, {name:'Name',email:'x@example.com',password:{}}])('rejects malformed registration %j', async body => {
 expect((await request(app).post('/api/auth/register').send(body)).status).toBe(400);
});

it.each([{status:null},{status:false},{status:0},{status:''},{priority:null},{priority:false},{priority:0},{priority:''}])('rejects explicitly invalid falsy enums %j', async fields => {
 const res = await request(app).post('/api/tasks').set(auth()).send({title:'Invalid enum',...fields});
 expect(res.status).toBe(400);
 expect(await Task.countDocuments({title:'Invalid enum'})).toBe(0);
});
it('verifies actual indexes, empty/out-of-range pages, absent dates and persisted CRUD timestamps', async () => {
 await Promise.all([User.init(),Task.init()]);
 const indexes=await Task.collection.indexes();
 expect(indexes.some(i=>i.key.userId===1 && i.key.createdAt===-1)).toBe(true);
 expect(indexes.some(i=>i.key.userId===1 && i.key.dueDate===1)).toBe(true);
 expect((await User.collection.indexes()).some(i=>i.key.email===1 && i.unique)).toBe(true);
 const empty=await request(app).get('/api/tasks').set(auth());
 expect(empty.body.pagination).toEqual({page:1,limit:10,totalTasks:0,totalPages:1});
 const created=await request(app).post('/api/tasks').set(auth()).send({title:'Persisted'});
 expect(created.status).toBe(201);
 const id=created.body.data._id;
 expect((await Task.findById(id)).title).toBe('Persisted');
 const updated=await request(app).put(`/api/tasks/${id}`).set(auth()).send({title:'Updated'});
 expect(new Date(updated.body.data.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(created.body.data.createdAt).getTime());
 expect((await Task.findById(id)).title).toBe('Updated');
 await Task.create({title:'Dated',userId:user.id,dueDate:'2026-12-01'});
 for(const order of ['asc','desc']) {
  const result=await request(app).get(`/api/tasks?sortBy=dueDate&order=${order}`).set(auth());
  expect(result.body.data.map(t=>t.title)).toEqual(order==='asc'?['Updated','Dated']:['Dated','Updated']);
 }
 const beyond=await request(app).get('/api/tasks?page=99&limit=1').set(auth());
 expect(beyond.body.data).toEqual([]);expect(beyond.body.pagination.totalPages).toBe(2);
 expect((await request(app).delete(`/api/tasks/${id}`).set(auth())).status).toBe(200);
 expect(await Task.findById(id)).toBeNull();
 for(const method of ['get','put','delete']) expect((await request(app)[method](`/api/tasks/${id}`).set(auth()).send({title:'Missing'})).status).toBe(404);
});

it('reports authentication database outages as server errors without exposing internals', async () => {
 const lookup=vi.spyOn(User,'findById').mockImplementation(()=>({select:()=>Promise.reject(new Error('private-database-detail'))}));
 try {
  const res=await request(app).get('/api/tasks').set(auth());
  expect(res.status).toBe(500);expect(res.body.message).toBe('Internal server error');
  expect(JSON.stringify(res.body)).not.toContain('private-database-detail');
 } finally {lookup.mockRestore();}
});
