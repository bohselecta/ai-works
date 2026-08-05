'use strict';

const DEFAULT_MODEL = 'gpt-5-nano-2025-08-07';
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const US_BASE_URL = 'https://us.api.openai.com/v1';
const ALLOWED_BASE_URLS = new Set([DEFAULT_BASE_URL, US_BASE_URL]);

function legacyEnvironmentKeys(env = process.env) {
  return ['LLM_PROVIDER', 'LLM_API_KEY', 'LLM_BASE_URL', 'LLM_MODEL'].filter((key) => Boolean(env[key]));
}

function providerConfig(env = process.env) {
  // Canonical AI WORKS intentionally ignores all legacy LLM_* variables.
  // This prevents stale settings from the pre-OpenAI comparison phase from
  // changing or breaking the production provider.
  const baseUrl = String(env.OPENAI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  if (!ALLOWED_BASE_URLS.has(baseUrl)) {
    const error = new Error(`AI WORKS accepts only OpenAI API endpoints: ${[...ALLOWED_BASE_URLS].join(' or ')}.`);
    error.code = 'UNSUPPORTED_ENDPOINT';
    throw error;
  }

  return {
    provider: 'openai',
    apiKey: env.OPENAI_API_KEY || '',
    baseUrl,
    model: env.OPENAI_MODEL || DEFAULT_MODEL,
    ignoredLegacyKeys: legacyEnvironmentKeys(env),
  };
}

async function callVerifier({ system, user }, env = process.env) {
  const config = providerConfig(env);
  if (!config.apiKey) {
    const error = new Error('The routing model is not configured. Add OPENAI_API_KEY in the server environment.');
    error.code = 'MODEL_NOT_CONFIGURED';
    throw error;
  }

  const body = {
    model: config.model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    reasoning_effort: 'minimal',
    verbosity: 'low',
    max_completion_tokens: 200,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'route_choice',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            choice: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            reason: { type: 'string', maxLength: 160 },
            clarifying_question: { anyOf: [{ type: 'string', maxLength: 240 }, { type: 'null' }] },
          },
          required: ['choice', 'confidence', 'reason', 'clarifying_question'],
          additionalProperties: false,
        },
      },
    },
    stream: false,
  };

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) throw await providerError(response);
  const payload = await response.json();
  return {
    raw: payload?.choices?.[0]?.message?.content || '',
    provider: config.provider,
    model: config.model,
    usage: payload?.usage || null,
  };
}

async function providerError(response) {
  let detail = '';
  try {
    const payload = await response.json();
    detail = payload?.message || payload?.error?.message || JSON.stringify(payload);
  } catch {
    detail = await response.text().catch(() => '');
  }
  const error = new Error(`OpenAI returned ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ''}`);
  error.code = response.status === 429 ? 'MODEL_BUSY' : 'MODEL_ERROR';
  error.status = response.status;
  return error;
}

module.exports = {
  ALLOWED_BASE_URLS,
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  US_BASE_URL,
  callVerifier,
  legacyEnvironmentKeys,
  providerConfig,
};
