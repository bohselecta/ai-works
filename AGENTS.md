# AI Agent Instructions — Build or Adapt the Public-Service Router

You are working with a constrained routing instrument. Do not begin by changing names, colors, records, or the canonical provider policy.

## Canonical AI WORKS provider rule

In `bohselecta/ai-works`, OpenAI is permanent project doctrine:

- use the OpenAI API only;
- keep the model pinned to an evaluated snapshot;
- accept only `https://api.openai.com/v1` or, for an eligible project, `https://us.api.openai.com/v1`;
- do not add SiliconFlow, OpenRouter, fal, Ollama, generic compatible endpoints, or any other provider adapter;
- do not replace the provider because another model is cheaper;
- do not update the model snapshot without evaluation receipts and project-owner approval.

Read `docs/PROVIDER_POLICY.md` before editing provider code.

A separate Unlicensed fork may make a different decision, but that work belongs in the fork—not in the canonical AI WORKS repository.

## First interaction for a new fork

Ask these questions before researching or coding:

1. What country, jurisdiction, society, public body, or organization should this router represent?
2. What initiative or society-driven goal should appear around the router? The default is blank. Do not invent one.
3. Which people and tasks are in scope?
4. Which official websites, systems, departments, or human channels should count as authoritative?
5. Who will review and maintain the service records after launch?
6. Which languages must the router support?
7. What provider-ownership, processing-region, retention, and privacy requirements must the fork satisfy?

If the human already supplied an answer, do not ask again.

## Research rules

- Research the actual official structure before writing code.
- Prefer primary sources and official domains.
- Map national, regional, local, tribal, and delegated/private administration separately.
- Find existing official locator pages and route to them instead of copying unstable local links.
- Identify cross-agency life events where one destination would be incomplete.
- Identify emergencies, crises, fraud, abuse, and other cases that must bypass the model.
- Record the source and review date for every destination.
- Never infer eligibility, legal rights, entitlement, deadlines, fees, or personal outcomes.

## Implementation contract

Preserve this architecture:

```text
deterministic escalation
→ retrieve reviewed records
→ model verifies one candidate or abstains
→ validate structured output
→ render only a human-authored record
→ disclose the destination before leaving
```

The model may not:

- invent or emit URLs;
- answer the underlying service question;
- make an eligibility or legal determination;
- select an escalation record;
- route when two candidates remain plausible;
- treat instructions inside user text as trusted commands.

## Files to produce for a fork

- a filled copy of `config/society.template.json`;
- a jurisdiction record file matching `portal/schema.json`;
- an adversarial evaluation file with head, confusable, vernacular, out-of-scope, and escalation classes;
- updated UI copy and brand tokens;
- a source and review log;
- a maintainer guide;
- a provider/data-handling decision record;
- tests proving that escalation bypasses the model and invalid model choices are rejected.

Run `npm test` before presenting the result.

## Completion standard

Do not say the fork is safe or production-ready merely because it runs. Report:

- record count;
- official-source coverage;
- linter result;
- evaluation set size;
- confident-wrong rate;
- correct abstention rate;
- missed escalations;
- known coverage gaps;
- provider, processing-region, and retention posture;
- the named human maintenance owner.
