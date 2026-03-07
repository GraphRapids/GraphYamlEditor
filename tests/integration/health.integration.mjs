import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost:6080';

describe('Health endpoint', () => {
  it('GET /health returns 200', async () => {
    const res = await fetch(`${SERVICE_URL}/health`);
    assert.equal(res.status, 200);
  });

  it('GET /health returns JSON { status: "ok" }', async () => {
    const res = await fetch(`${SERVICE_URL}/health`);
    assert.ok(
      (res.headers.get('content-type') || '').includes('application/json'),
      'Content-Type should be application/json',
    );
    const body = await res.json();
    assert.deepStrictEqual(body, { status: 'ok' });
  });
});
