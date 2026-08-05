# AI WORKS

**Make AI work for Americans—not the other way around.**

This repository contains two connected public-interest artifacts:

1. the **AI WORKS Act** landing page and working policy package; and
2. the **Public Service Router**, a constrained AI tool that helps a person describe a task and reach a reviewed U.S. government source.

The router is deliberately a secondary demonstration, not the main initiative. It shows the governing idea in working software: use AI to narrow a public problem, disclose the source, preserve human control, and abstain rather than guess.

## Permanent provider decision

The canonical AI WORKS project uses the **OpenAI API only**.

- Default model: `gpt-5-nano-2025-08-07`
- Standard endpoint: `https://api.openai.com/v1`
- Preferred endpoint for an eligible U.S. data-residency project: `https://us.api.openai.com/v1`
- Non-OpenAI providers and arbitrary compatible endpoints are rejected in code.

Cost comparisons were useful during design. The final provider decision reflects the project's U.S. public-interest identity and is documented in [`docs/PROVIDER_POLICY.md`](docs/PROVIDER_POLICY.md). Model snapshots may be upgraded only after the routing evaluations pass and the project owner approves the change.

## Router safety model

The application does **not** ask a model to answer a government question.

```text
person's words
    ↓
deterministic emergency check
    ↓
lexical retrieval of reviewed records
    ↓
OpenAI verifies one candidate OR abstains
    ↓
site renders a human-authored record verbatim
```

The model cannot create a URL, decide eligibility, write agency guidance, or silently route an emergency. See [`docs/PORTAL_ARCHITECTURE.md`](docs/PORTAL_ARCHITECTURE.md). Current rate notes and bounded request-cost estimates are in [`docs/MODEL_COSTS.md`](docs/MODEL_COSTS.md).

## Run locally

Requires Node.js 24.x and Python 3 for the record linter.

```bash
cp .env.example .env.local
# Add your OpenAI API key to .env.local.
npm run dev
```

Open `http://localhost:8080`.

### Environment

```env
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-5-nano-2025-08-07
OPENAI_BASE_URL=https://api.openai.com/v1
ROUTER_CONFIDENCE=0.78
```

An organization approved for OpenAI U.S. data residency should use:

```env
OPENAI_BASE_URL=https://us.api.openai.com/v1
```

## Deploy to Vercel

1. Import this repository into Vercel.
2. Add `OPENAI_API_KEY` as a project environment variable.
3. Optionally add the pinned `OPENAI_MODEL` and approved `OPENAI_BASE_URL` values.
4. Remove any old `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, or `LLM_BASE_URL` variables left from earlier provider comparisons. The canonical app ignores them, but removing them prevents operator confusion.
5. Deploy from the repository root. No build command is required.

After deployment, open `/api/health`. It reports only non-secret readiness information: whether `OPENAI_API_KEY` is configured, the pinned model and endpoint, reviewed-record count, Node version, and deployed commit.

The static site is served normally, while `api/route.js` runs as a serverless function. Never place an API key in browser JavaScript.

## Validate

```bash
npm test
```

This runs router tests, the OpenAI provider-policy test, the mocked OpenAI integration test, and the record linter. The linter turns project doctrine into build failures: asserted freshness, eligibility language, unresolved journeys, weak escalation handling, and hard-to-read summaries all fail.

To run the OpenAI evaluation probe against the adversarial seed:

```bash
export OPENAI_API_KEY=your-key
python3 portal/probe.py \
  --records data/records.us.json \
  --eval portal/eval-seed.json
```

The seed evaluation is not yet large enough to prove safety. Expand it to the class targets before treating the gates as decisive.

## Adapt it to another society or organization

The router module is released under the Unlicense. Start with [`AGENTS.md`](AGENTS.md), [`config/society.template.json`](config/society.template.json), and [`docs/ADAPTATION_GUIDE.md`](docs/ADAPTATION_GUIDE.md).

The U.S. deployment remains AI WORKS. A fork begins with a blank initiative and must ask its adopter:

- What country, jurisdiction, public body, or organization is being mapped?
- What society-driven goal should the initiative serve?
- Which official sources are in scope?
- Who will maintain and review the records?

A separate fork may make its own provider decision under the Unlicense. That does not add alternative providers to the canonical AI WORKS repository.

## Repository map

```text
index.html                         AI WORKS landing page + embedded router UI
styles.css / script.js             design system and client behavior
api/route.js                       Vercel serverless endpoint
api/health.js                      non-secret deployment readiness check
lib/router.js                      retrieval, deterministic escalation, validation
lib/provider.js                    OpenAI-only provider enforcement
lib/route-handler.js               shared routing flow
data/records.us.json               U.S. record manifest
data/records.us.*.json             reviewed U.S. service record groups
portal/schema.json                 record schema and doctrine
portal/lint.py                     build-failing record linter
portal/probe.py                    OpenAI model evaluation harness
portal/eval-seed.json              adversarial seed set
docs/PORTAL_ARCHITECTURE.md        safety and operating model
docs/PROVIDER_POLICY.md            permanent OpenAI provider decision
docs/ADAPTATION_GUIDE.md           fork workflow
docs/MODEL_COSTS.md                OpenAI pricing and route-cost estimate
AGENTS.md                          instructions for an AI coding agent
UNLICENSE                          public-domain dedication
```

## Important limits

This is an experimental directory, not an official government service. It does not determine eligibility, file forms, interpret notices, or replace an agency. Records must be reviewed and expanded before broader use. A confident wrong route is the primary failure to prevent.
