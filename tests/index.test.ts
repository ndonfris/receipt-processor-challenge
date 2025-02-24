import request from 'supertest';
import app from '../src/app';

describe('API Health Check', () => {
  it('API endpoints should be available', async () => {
    // Just a simple check that the API routes are reachable
    const response = await request(app)
      .post('/receipts/process')
      .send({}) // Invalid data, but we just want to check the route exists
      .expect('Content-Type', /json/);
    
    // We expect a 400 status because we sent invalid data
    // This confirms the route exists and is processing requests
    expect(response.status).toBe(400);
  });
});
