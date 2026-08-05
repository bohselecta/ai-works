'use strict';

const assert = require('assert');
const { callVerifier, providerConfig } = require('../lib/provider');
const { routeQuery } = require('../lib/route-handler');

async function main() {
  const originalFetch = global.fetch;
  let requestSeen = false;

  global.fetch = async (url, options) => {
    requestSeen = true;
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer test');

    const payload = JSON.parse(options.body);
    assert.equal(payload.model, 'gpt-5-nano-2025-08-07');
    assert.equal(payload.messages[0].role, 'system');
    assert.equal(payload.reasoning_effort, 'minimal');
    assert.equal(payload.verbosity, 'low');
    assert.equal(payload.max_completion_tokens, 200);
    assert.equal(payload.response_format.type, 'json_schema');
    assert.equal(payload.response_format.json_schema.strict, true);

    return new Response(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            choice: 1,
            confidence: 0.96,
            reason: 'Exact refund task',
            clarifying_question: null,
          }),
        },
      }],
      usage: { prompt_tokens: 500, completion_tokens: 24, total_tokens: 524 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const config = providerConfig({ OPENAI_API_KEY: 'test' });
    assert.equal(config.provider, 'openai');
    assert.equal(config.model, 'gpt-5-nano-2025-08-07');
    assert.equal(config.baseUrl, 'https://api.openai.com/v1');

    const staleLegacy = providerConfig({
      LLM_PROVIDER: 'siliconflow',
      LLM_API_KEY: 'legacy-secret',
      LLM_BASE_URL: 'https://api.siliconflow.com/v1',
      LLM_MODEL: 'legacy-model',
    });
    assert.equal(staleLegacy.provider, 'openai');
    assert.equal(staleLegacy.apiKey, '');
    assert.equal(staleLegacy.baseUrl, 'https://api.openai.com/v1');
    assert.equal(staleLegacy.model, 'gpt-5-nano-2025-08-07');
    assert.deepEqual(staleLegacy.ignoredLegacyKeys.sort(), ['LLM_API_KEY', 'LLM_BASE_URL', 'LLM_MODEL', 'LLM_PROVIDER'].sort());
    assert.throws(
      () => providerConfig({ OPENAI_API_KEY: 'test', OPENAI_BASE_URL: 'https://example.com/v1' }),
      (error) => error.code === 'UNSUPPORTED_ENDPOINT',
    );

    const direct = await callVerifier({ system: 'System', user: 'User' }, { OPENAI_API_KEY: 'test' });
    assert.equal(direct.provider, 'openai');

    const result = await routeQuery('where is my tax refund', {
      OPENAI_API_KEY: 'test',
      ROUTER_CONFIDENCE: '0.78',
    });
    assert.equal(result.status, 'match');
    assert.equal(result.record.id, 'irs.refund-status');
    assert.equal(result.architecture, 'retrieve-then-verify');
    assert.equal(result.model.provider, 'openai');
    assert.equal(requestSeen, true);

    console.log('OpenAI provider policy and integration tests passed');
  } finally {
    global.fetch = originalFetch;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
