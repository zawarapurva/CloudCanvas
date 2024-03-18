const request = require('supertest');
const express = require("express");
const app = express();

const healthRoute = require("../routes/health.route");
app.use("/healthz", healthRoute);

describe('/healthz Endpoint', () => {
  it('should return 200 OK on a valid request', async () => {
    const response = await request(app).get('/healthz');
    expect(response.status).toBe(200);
  });
});
