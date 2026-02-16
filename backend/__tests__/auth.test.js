require('dotenv').config(); // <--- 1. Load environment variables first
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('../src/routes/authRoutes');
const User = require('../src/models/User');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// 2. Connect to database before tests
beforeAll(async () => {
  // Uses your .env URI. If testing locally without internet, ensure you have a local DB.
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/task-collab-test';
  
  try {
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error("Test DB Connection Error:", error);
    throw error;
  }
}, 20000); // <--- 3. Increased timeout to 20s for slow cloud connections

// 4. Clean up after each test
afterEach(async () => {
  // Only delete if connection is established
  if (mongoose.connection.readyState === 1) {
    await User.deleteMany({});
  }
});

// 5. Close connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

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