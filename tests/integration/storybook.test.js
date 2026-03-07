import { describe, it, expect } from 'vitest';

const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost:8080';

describe('Storybook static site', () => {
  it('serves the index page at /', async () => {
    const res = await fetch(`${SERVICE_URL}/`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain('<html');
  });

  it('serves the iframe entry point', async () => {
    const res = await fetch(`${SERVICE_URL}/iframe.html`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain('<html');
  });

  it('returns 404 for unknown paths', async () => {
    const res = await fetch(`${SERVICE_URL}/does-not-exist-${Date.now()}`);
    expect(res.status).toBe(404);
  });
});
