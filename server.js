'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { routeQuery } = require('./lib/route-handler');

loadEnv(path.join(__dirname, '.env.local'));
loadEnv(path.join(__dirname, '.env'));

const port = Number(process.env.PORT || 8080);
const root = __dirname;
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml',
};

http.createServer(async (req, res) => {
  if (req.url === '/api/route' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { if (body.length < 25000) body += chunk; });
    req.on('end', async () => {
      let payload = {};
      try { payload = JSON.parse(body); } catch {}
      const result = await routeQuery(payload.query);
      const status = result.status === 'invalid' ? 400 : result.status === 'unavailable' ? 503 : 200;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(result));
    });
    return;
  }

  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const filePath = requestPath === '/' ? path.join(root, 'index.html') : path.join(root, requestPath.replace(/^\//, ''));
  if (!filePath.startsWith(root)) return send(res, 403, 'Forbidden');

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) return send(res, 404, 'Not found');
    res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(port, () => {
  console.log(`AI WORKS running at http://localhost:${port}`);
  console.log(`Router provider: ${process.env.LLM_PROVIDER || 'siliconflow'} / ${process.env.LLM_MODEL || 'Qwen/Qwen3.5-9B'}`);
});

function send(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    if (!(key.trim() in process.env)) process.env[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
}
