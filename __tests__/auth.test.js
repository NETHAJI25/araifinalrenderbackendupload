const request = require('supertest');
const app = require('../server');

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        college: 'Test College',
        course: 'Computer Science',
        year: '3rd Year',
        city: 'Test City',
        state: 'Test State',
        country: 'India'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
  });

  it('should login user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });
});