# Provider Policy — OpenAI Is Canonical

**Status:** Accepted and permanent for the canonical AI WORKS project  
**Decision date:** August 5, 2026  
**Owner:** Hayden Lindley / AI WORKS

## Decision

The canonical `bohselecta/ai-works` deployment uses the **OpenAI API only**.

- Production provider: **OpenAI**
- Default pinned model: **`gpt-5-nano-2025-08-07`**
- Standard endpoint: **`https://api.openai.com/v1`**
- Preferred endpoint for an eligible U.S. data-residency project: **`https://us.api.openai.com/v1`**

The repository does not include adapters, examples, or production instructions for non-OpenAI model providers. An environment variable may not silently change the provider or route requests through an arbitrary OpenAI-compatible endpoint.

## Why this is permanent

AI WORKS is a United States public-interest initiative. Cost comparisons were useful during architecture work, but the canonical service should use an American-owned API provider whose governance, data controls, model documentation, and regional-processing path can be stated plainly to the public.

This is a provider decision, not a promise to freeze one model forever. The model snapshot may change only when:

1. the proposed OpenAI model is evaluated against the routing test set;
2. confident-wrong, abstention, escalation, latency, and cost receipts are recorded;
3. the change is explicit in code and documentation; and
4. the project owner approves it.

## Enforcement

`lib/provider.js` rejects:

- any `LLM_PROVIDER` value other than `openai`; and
- any endpoint other than `api.openai.com` or `us.api.openai.com`.

The provider-policy tests must remain in the default test suite.

## Forks

The software is released under the Unlicense. A separate fork may make a different provider decision. That freedom does not make alternative providers part of the canonical AI WORKS project, and changes adding them back here should be rejected unless the project owner explicitly reverses this decision.
