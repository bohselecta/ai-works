# AI WORKS

**Make AI work for Americans—not the other way around.**

This repository contains two connected public-interest artifacts:

1. the **AI WORKS Act** landing page and working policy package; and
2. the **Public Service Router**, a constrained AI tool that helps a person describe a task and reach a reviewed U.S. government source.

The router is deliberately a secondary demonstration, not the main initiative. It shows the governing idea in working software: use AI to narrow a public problem, disclose the source, preserve human control, and abstain rather than guess.

## Router safety model

The application does **not** ask a model to answer a government question.

```text
person's words
    ↓
deterministic emergency check
    ↓
lexical retrieval of reviewed records
    ↓
model verifies one candidate OR abstains
    ↓
site renders a human-authored record verbatim
```

The model cannot create a URL, decide eligibility, write agency guidance, or silently route an emergency. See [`docs/PORTAL_ARCHITECTURE.md`](docs/PORTAL_ARCHITECTURE.md). Current provider-rate notes and a request-cost estimate are in [`docs/MODEL_COSTS.md`](docs/MODEL_COSTS.md).

## Run locally

Requires Node.js 20+ and Python 3 for the record linter.

```bash
cp .env.example .env.local
# Add a cloud key, or switch the file to Ollama.
npm run dev
```

Open `http://localhost:8080`.

### SiliconFlow

```env
LLM_PROVIDER=siliconflow
LLM_API_KEY=your-key
LLM_MODEL=Qwen/Qwen3.5-9B
LLM_BASE_URL=https://api.siliconflow.com/v1
```

### fal

fal exposes an OpenAI-compatible LLM route through OpenRouter.

```env
LLM_PROVIDER=fal
LLM_API_KEY=your-key
LLM_MODEL=google/gemini-2.5-flash
LLM_BASE_URL=https://fal.run/openrouter/router/openai/v1
```

### Ollama for local development

```env
LLM_PROVIDER=ollama
LLM_MODEL=qwen3:4b
LLM_BASE_URL=http://127.0.0.1:11434
```

## Deploy to Vercel

1. Import this repository into Vercel.
2. Add `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, and `LLM_BASE_URL` as project environment variables.
3. Deploy from the repository root. No build command is required.

The static site is served normally, while `api/route.js` runs as a serverless function. Never place an API key in browser JavaScript.

## Validate

```bash
npm test
```

This runs the router unit tests and the record linter. The linter turns the project doctrine into build failures: asserted freshness, eligibility language, unresolved journeys, weak escalation handling, and hard-to-read summaries all fail.

To run the local-model probe:

```bash
python3 portal/probe.py \
  --model qwen3:4b \
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

## Repository map

```text
index.html                         AI WORKS landing page + embedded router UI
styles.css / script.js             design system and client behavior
api/route.js                       Vercel serverless endpoint
lib/router.js                      retrieval, deterministic escalation, validation
lib/provider.js                    SiliconFlow, fal, Ollama, generic adapters
lib/route-handler.js               shared routing flow
data/records.us.json               U.S. record manifest
data/records.us.*.json             reviewed U.S. service record groups
portal/schema.json                 record schema and doctrine
portal/lint.py                     build-failing record linter
portal/probe.py                    model evaluation harness
portal/eval-seed.json              adversarial seed set
docs/PORTAL_ARCHITECTURE.md        safety and operating model
docs/ADAPTATION_GUIDE.md           fork workflow
docs/MODEL_COSTS.md                provider pricing and route-cost estimate
AGENTS.md                          instructions for an AI coding agent
UNLICENSE                          public-domain dedication
```

## Important limits

This is an experimental directory, not an official government service. It does not determine eligibility, file forms, interpret notices, or replace an agency. Records must be reviewed and expanded before broader use. A confident wrong route is the primary failure to prevent.
