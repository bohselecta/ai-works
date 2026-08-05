'use strict';

const {
  buildCandidatePrompt,
  detectEscalation,
  parseModelJson,
  publicRecord,
  retrieve,
  validateModelChoice,
} = require('./router');
const { callVerifier } = require('./provider');

async function routeQuery(query, env = process.env) {
  const startedAt = Date.now();
  const cleaned = String(query || '').replace(/\s+/g, ' ').trim();

  if (cleaned.length < 3) {
    return { status: 'invalid', message: 'Describe the government task in a few words.' };
  }
  if (cleaned.length > 500) {
    return { status: 'invalid', message: 'Please keep the request under 500 characters.' };
  }

  const escalation = detectEscalation(cleaned);
  if (escalation) {
    return {
      status: 'escalation',
      record: publicRecord(escalation),
      latency_ms: Date.now() - startedAt,
      architecture: 'deterministic-before-model',
    };
  }

  const candidates = retrieve(cleaned, 6);
  if (!candidates.length) {
    return {
      status: 'abstain',
      message: 'This directory does not yet have a strong match for that request.',
      clarifying_question: 'Can you name the document, benefit, agency, or life event involved?',
      latency_ms: Date.now() - startedAt,
    };
  }

  try {
    const prompt = buildCandidatePrompt(cleaned, candidates);
    const modelResult = await callVerifier(prompt, env);
    const answer = parseModelJson(modelResult.raw);
    const checked = validateModelChoice(answer, candidates, Number(env.ROUTER_CONFIDENCE || 0.78));

    if (!checked.record) {
      return {
        status: 'abstain',
        message: 'The router is not sure enough to send you somewhere.',
        clarifying_question: checked.clarifyingQuestion || 'What exact task are you trying to complete?',
        possible_matches: candidates.slice(0, 3).map((record) => ({ id: record.id, name: record.name, agency: record.agency_full })),
        confidence: checked.confidence,
        latency_ms: Date.now() - startedAt,
        model: { provider: modelResult.provider, name: modelResult.model, usage: modelResult.usage },
      };
    }

    return {
      status: 'match',
      record: publicRecord(checked.record),
      confidence: checked.confidence,
      routing_note: checked.reason,
      latency_ms: Date.now() - startedAt,
      model: { provider: modelResult.provider, name: modelResult.model, usage: modelResult.usage },
      architecture: 'retrieve-then-verify',
    };
  } catch (error) {
    if (error.code === 'MODEL_NOT_CONFIGURED') {
      return {
        status: 'unavailable',
        message: 'The service router is installed but its cloud model key has not been added yet.',
        setup: 'Set LLM_API_KEY, LLM_PROVIDER, and LLM_MODEL on the server.',
        latency_ms: Date.now() - startedAt,
      };
    }

    console.error('routeQuery model failure', error);
    return {
      status: 'abstain',
      message: 'The router could not verify a destination right now, so it did not guess.',
      clarifying_question: 'Please try again in a moment or use USA.gov to browse services.',
      fallback: { name: 'Browse U.S. government services', destination: 'https://www.usa.gov/' },
      latency_ms: Date.now() - startedAt,
    };
  }
}

module.exports = { routeQuery };
