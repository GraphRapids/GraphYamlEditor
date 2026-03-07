/**
 * Minimal zero-dependency static file server with a /health endpoint.
 *
 * Environment variables:
 *   PORT       – listen port (default 6080)
 *   STATIC_DIR – directory to serve (default ./storybook-static)
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const PORT = parseInt(process.env.PORT || '6080', 10);
const STATIC_DIR = resolve(process.env.STATIC_DIR || 'storybook-static');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

/**
 * Return true when `resolved` is equal to `root` or is a child path of
 * `root`.  The trailing-separator check prevents prefix-collision attacks
 * where e.g. /app/static-evil would incorrectly pass a naive
 * startsWith('/app/static') guard.
 */
function isSafePath(resolved, root) {
  if (resolved === root) return true;
  // Require that root is followed by the path separator
  return resolved.startsWith(root + '/');
}

const server = createServer(async (req, res) => {
  // --- health endpoint ------------------------------------------------
  if (req.method === 'GET' && req.url?.split('?')[0] === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  // --- static file serving --------------------------------------------
  let pathname;
  try {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  // Reject null bytes which can confuse downstream fs calls
  if (pathname.includes('\0')) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  const filePath = join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const resolved = resolve(filePath);

  if (!isSafePath(resolved, STATIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const data = await readFile(resolved);
    const ext = extname(resolved);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving ${STATIC_DIR} on http://0.0.0.0:${PORT}`);
});
