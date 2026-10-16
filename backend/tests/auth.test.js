import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri('task_management_test'));
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API', () => {
  it('registers a user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dev Sharma',
        email: 'dev@example.com',
        password: 'StrongPassword123'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('dev@example.com');
    expect(res.body.data.password).toBeUndefined();
  });

  it('rejects missing registration fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User' });

    expect(res.status).toBe(400);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'bad-email', password: 'StrongPassword123' });

    expect(res.status).toBe(400);
  });

  it('rejects duplicate email registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dev Sharma',
        email: 'dev@example.com',
        password: 'StrongPassword123'
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dev Sharma',
        email: 'dev@example.com',
        password: 'StrongPassword123'
      });

    expect(res.status).toBe(409);
  });

  it('hashes the password before saving', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dev Sharma',
        email: 'dev@example.com',
        password: 'StrongPassword123'
      });

    const user = await User.findOne({ email: 'dev@example.com' });
    expect(user.password).not.toBe('StrongPassword123');
    expect(user.password).toMatch(/\$2[aby]\$/);
    expect(await bcrypt.compare('StrongPassword123',user.password)).toBe(true);
  });

  it('logs in the user successfully', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dev Sharma',
        email: 'dev@example.com',
        password: 'StrongPassword123'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@example.com', password: 'StrongPassword123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    const payload=jwt.verify(res.body.token,process.env.JWT_SECRET);
    const stored=await User.findOne({email:'dev@example.com'});
    expect(payload.sub).toBe(stored.id);
    expect(payload.exp).toBeGreaterThan(payload.iat);
    expect(res.body.data.password).toBeUndefined();
  });

  it('rejects invalid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dev Sharma',
        email: 'dev@example.com',
        password: 'StrongPassword123'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@example.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
  });

  it('rejects missing token for protected routes', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });

  it('rejects expired token', async () => {
    const user = await User.create({ name: 'Expired User', email: 'expired@example.com', password: 'test-password-hash' });
    const expiredToken = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: -1 });
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});

it('rejects passwords below the policy minimum without storing a user',async()=>{
 const res=await request(app).post('/api/auth/register').send({name:'Short Password',email:'short@example.com',password:'short'});
 expect(res.status).toBe(400);expect(await User.countDocuments({email:'short@example.com'})).toBe(0);
});
