'use strict';

function providerConfig(env = process.env) {
  const provider = (env.LLM_PROVIDER || 'siliconflow').toLowerCase();
  const apiKey = env.LLM_API_KEY || env.SILICONFLOW_API_KEY || env.FAL_KEY || '';

  if (provider === 'ollama') {
    return {
      provider,
      apiKey: '',
      baseUrl: (env.LLM_BASE_URL || env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
      model: env.LLM_MODEL || 'qwen3:4b',
      authScheme: null,
    };
  }

  if (provider === 'fal') {
    return {
      provider,
      apiKey,
      baseUrl: (env.LLM_BASE_URL || 'https://fal.run/openrouter/router/openai/v1').replace(/\/$/, ''),
      model: env.LLM_MODEL || 'google/gemini-2.5-flash',
      authScheme: 'Key',
    };
  }

  if (provider === 'siliconflow') {
    return {
      provider,
      apiKey,
      baseUrl: (env.LLM_BASE_URL || 'https://api.siliconflow.com/v1').replace(/\/$/, ''),
      model: env.LLM_MODEL || 'Qwen/Qwen3.5-9B',
      authScheme: 'Bearer',
    };
  }

  return {
    provider: 'openai-compatible',
    apiKey,
    baseUrl: (env.LLM_BASE_URL || '').replace(/\/$/, ''),
    model: env.LLM_MODEL || '',
    authScheme: env.LLM_AUTH_SCHEME || 'Bearer',
  };
}

async function callVerifier({ system, user }, env = process.env) {
  const config = providerConfig(env);
  if (config.provider !== 'ollama' && !config.apiKey) {
    const error = new Error('The routing model is not configured. Add LLM_API_KEY in the server environment.');
    error.code = 'MODEL_NOT_CONFIGURED';
    throw error;
  }
  if (!config.baseUrl || !config.model) {
    const error = new Error('LLM_BASE_URL and LLM_MODEL must be configured.');
    error.code = 'MODEL_NOT_CONFIGURED';
    throw error;
  }

  if (config.provider === 'ollama') {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        stream: false,
        format: 'json',
        options: { temperature: 0, num_predict: 120 },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw await providerError(response, config.provider);
    const payload = await response.json();
    return {
      raw: payload?.message?.content || '',
      provider: config.provider,
      model: config.model,
      usage: null,
    };
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `${config.authScheme} ${config.apiKey}`,
  };

  const body = {
    model: config.model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0,
    max_tokens: 120,
    stream: false,
  };

  if (config.provider === 'siliconflow') {
    body.response_format = { type: 'json_object' };
    body.enable_thinking = false;
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) throw await providerError(response, config.provider);
  const payload = await response.json();
  return {
    raw: payload?.choices?.[0]?.message?.content || '',
    provider: config.provider,
    model: config.model,
    usage: payload?.usage || null,
  };
}

async function providerError(response, provider) {
  let detail = '';
  try {
    const payload = await response.json();
    detail = payload?.message || payload?.error?.message || JSON.stringify(payload);
  } catch {
    detail = await response.text().catch(() => '');
  }
  const error = new Error(`${provider} returned ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ''}`);
  error.code = response.status === 429 ? 'MODEL_BUSY' : 'MODEL_ERROR';
  error.status = response.status;
  return error;
}

module.exports = { callVerifier, providerConfig };
