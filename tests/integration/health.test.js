import { describe, it, expect } from 'vitest';

const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost:8080';

describe('Health endpoint', () => {
  it('GET /health returns 200 with { status: "ok" }', async () => {
    const res = await fetch(`${SERVICE_URL}/health`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('GET /health returns application/json content-type', async () => {
    const res = await fetch(`${SERVICE_URL}/health`);
    expect(res.headers.get('content-type')).toBe('application/json');
  });
});
