import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Task from '../src/models/Task.js';

let mongoServer;
let userA;
let userB;
let tokenA;
let tokenB;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri('task_management_test'));
});

beforeEach(async () => {
  await User.deleteMany({});
  await Task.deleteMany({});

  await request(app)
    .post('/api/auth/register')
    .send({ name: 'User A', email: 'usera@example.com', password: 'StrongPassword123' });

  await request(app)
    .post('/api/auth/register')
    .send({ name: 'User B', email: 'userb@example.com', password: 'StrongPassword123' });

  userA = await User.findOne({ email: 'usera@example.com' });
  userB = await User.findOne({ email: 'userb@example.com' });

  const loginA = await request(app)
    .post('/api/auth/login')
    .send({ email: 'usera@example.com', password: 'StrongPassword123' });

  const loginB = await request(app)
    .post('/api/auth/login')
    .send({ email: 'userb@example.com', password: 'StrongPassword123' });

  tokenA = loginA.body.token;
  tokenB = loginB.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Task API', () => {
  it('creates a task for the authenticated user', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Finish MERN assessment',
        description: 'Implement CRUD and auth',
        status: 'in-progress',
        priority: 'high',
        dueDate: '2026-10-20'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Finish MERN assessment');
  });

  it('lists only the authenticated user tasks', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task A', status: 'pending', priority: 'low' });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('retrieves a single task by id', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task A', status: 'pending', priority: 'low' });

    const res = await request(app)
      .get(`/api/tasks/${created.body.data._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Task A');
  });

  it('updates a task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task A', status: 'pending', priority: 'low' });

    const res = await request(app)
      .put(`/api/tasks/${created.body.data._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Updated task', status: 'completed', priority: 'high' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated task');
  });

  it('deletes a task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task A', status: 'pending', priority: 'low' });

    const res = await request(app)
      .delete(`/api/tasks/${created.body.data._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
  });

  it('rejects invalid task ids', async () => {
    const res = await request(app)
      .get('/api/tasks/not-a-valid-id')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
  });

  it('rejects invalid task data', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '', priority: 'unknown' });

    expect(res.status).toBe(400);
  });

  it('filters tasks by status', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task pending', status: 'pending', priority: 'low' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task complete', status: 'completed', priority: 'medium' });

    const res = await request(app)
      .get('/api/tasks?status=pending')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((task) => task.status === 'pending')).toBe(true);
  });

  it('filters tasks by priority', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task high', status: 'pending', priority: 'high' });

    const res = await request(app)
      .get('/api/tasks?priority=high')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((task) => task.priority === 'high')).toBe(true);
  });

  it('searches for tasks by title', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Quarterly report review', status: 'pending', priority: 'low' });

    const res = await request(app)
      .get('/api/tasks?search=report')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((task) => task.title.includes('report'))).toBe(true);
  });

  it('sorts tasks by due date and pagination', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task 1', dueDate: '2026-10-25', status: 'pending', priority: 'low' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task 2', dueDate: '2026-10-10', status: 'pending', priority: 'low' });

    const res = await request(app)
      .get('/api/tasks?sortBy=dueDate&order=asc&page=1&limit=1')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.data.length).toBe(1);
  });

  it('returns dashboard statistics for the current user', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task pending', status: 'pending', priority: 'low' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task progress', status: 'in-progress', priority: 'medium' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task complete', status: 'completed', priority: 'high' });

    const res = await request(app)
      .get('/api/tasks/stats')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.pending).toBe(1);
    expect(res.body.data.inProgress).toBe(1);
    expect(res.body.data.completed).toBe(1);
  });

  it('enforces ownership for task access and updates', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'A secret task', status: 'pending', priority: 'high' });

    const res = await request(app)
      .get(`/api/tasks/${created.body.data._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    const updateRes = await request(app)
      .put(`/api/tasks/${created.body.data._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'hacked' });

    const deleteRes = await request(app)
      .delete(`/api/tasks/${created.body.data._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    expect(updateRes.status).toBe(404);
    expect(deleteRes.status).toBe(404);
  });
});


describe('Task route authentication', () => {
  const taskId = new mongoose.Types.ObjectId().toString();

  it.each([
    ['get', '/api/tasks'],
    ['post', '/api/tasks'],
    ['get', '/api/tasks/stats'],
    ['get', `/api/tasks/${taskId}`],
    ['put', `/api/tasks/${taskId}`],
    ['delete', `/api/tasks/${taskId}`],
  ])('rejects unauthenticated %s %s without changing tasks', async (method, path) => {
    const count = await Task.countDocuments();
    const response = await request(app)[method](path).send({ title: 'Unauthorized task' });

    expect(response.status).toBe(401);
    expect(await Task.countDocuments()).toBe(count);
  });
});
