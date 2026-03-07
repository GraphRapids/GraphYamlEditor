import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost:6080';

describe('Storybook static server', () => {
  it('GET / serves an HTML page', async () => {
    const res = await fetch(`${SERVICE_URL}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('<html'), 'Response should contain an HTML document');
  });

  it('returns 404 for unknown paths', async () => {
    const res = await fetch(`${SERVICE_URL}/__does_not_exist_${Date.now()}`);
    assert.equal(res.status, 404);
  });

  it('blocks path-traversal attempts', async () => {
    const res = await fetch(`${SERVICE_URL}/%2e%2e/%2e%2e/etc/passwd`);
    // Expect 400, 403, or 404 – any non-success status is acceptable
    assert.ok(
      res.status >= 400,
      `Expected >= 400 for path traversal, got ${res.status}`,
    );
  });
});
