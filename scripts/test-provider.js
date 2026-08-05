'use strict';

const assert = require('assert');
const http = require('http');
const { routeQuery } = require('../lib/route-handler');

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    const payload = JSON.parse(body);
    assert.equal(payload.model, 'test-router');
    assert.equal(payload.messages[0].role, 'system');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ choice: 1, confidence: 0.96, reason: 'Exact refund task', clarifying_question: null }) } }],
      usage: { prompt_tokens: 500, completion_tokens: 24, total_tokens: 524 },
    }));
  });
});

server.listen(0, '127.0.0.1', async () => {
  try {
    const { port } = server.address();
    const result = await routeQuery('where is my tax refund', {
      LLM_PROVIDER: 'openai-compatible',
      LLM_API_KEY: 'test',
      LLM_MODEL: 'test-router',
      LLM_BASE_URL: `http://127.0.0.1:${port}/v1`,
      LLM_AUTH_SCHEME: 'Bearer',
      ROUTER_CONFIDENCE: '0.78',
    });
    assert.equal(result.status, 'match');
    assert.equal(result.record.id, 'irs.refund-status');
    assert.equal(result.architecture, 'retrieve-then-verify');
    console.log('provider integration test passed');
  } finally {
    server.close();
  }
});
