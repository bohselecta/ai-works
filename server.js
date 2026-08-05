'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { routeQuery } = require('./lib/route-handler');

loadEnv(path.join(process.cwd(), '.env.local'));
loadEnv(path.join(process.cwd(), '.env'));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/route') {
    try {
      const body = await readBody(req, 12_000);
      const payload = JSON.parse(body || '{}');
      const result = await routeQuery(payload.query);
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, error.code === 'BODY_TOO_LARGE' ? 413 : 400, { status: 'invalid', message: 'The request could not be read.' });
    }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); res.end('Method not allowed'); return;
  }

  let relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  relative = relative.replace(/^\/+/, '');
  const root = process.cwd();
  const target = path.resolve(root, relative);
  if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(target)] || 'application/octet-stream' });
  if (req.method === 'HEAD') { res.end(); return; }
  fs.createReadStream(target).pipe(res);
});

const port = Number(process.env.PORT || 8080);
server.listen(port, () => {
  console.log(`AI WORKS running at http://localhost:${port}`);
  console.log(`Router provider: OpenAI / ${process.env.OPENAI_MODEL || process.env.LLM_MODEL || 'gpt-5-nano-2025-08-07'}`);
});

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) continue;
    const index = clean.indexOf('=');
    if (index < 1) continue;
    const key = clean.slice(0, index).trim();
    const value = clean.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; let body = '';
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) { const error = new Error('too large'); error.code = 'BODY_TOO_LARGE'; reject(error); req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}
