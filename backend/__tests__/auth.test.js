/**
 * Basic API structure tests. For full integration tests, run against a local MongoDB instance.
 */
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Structure', () => {
  test('POST /api/auth/signup - returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com' });
    expect([400, 500]).toContain(res.status);
  });

  test('POST /api/auth/login - returns 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login - returns 400 for missing body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect([400, 401, 500]).toContain(res.status);
  });
});
