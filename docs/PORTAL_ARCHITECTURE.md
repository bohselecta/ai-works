# Public Service Router

## Purpose

The Public Service Router is a small working example of the AI WORKS doctrine. It helps a person describe a government task in ordinary language and reach a human-reviewed official source.

It is not a chatbot that answers government questions. It is a routing instrument.

## The safety argument

A free-form model can invent a plausible agency, URL, deadline, fee, or eligibility claim. The router removes that authority from the model.

The model receives:

- the person's text;
- at most six retrieved candidate records;
- a requirement to choose one numbered candidate or return `null`.

The model never receives permission to compose the result. The application validates the response and renders only a record loaded through the `data/records.us.json` manifest.

### Flow

1. **Deterministic escalation** runs before retrieval. Crisis and emergency patterns never depend on model judgment.
2. **Retrieval** scores service names, summaries, agencies, and vernacular aliases.
3. **Verification** asks the model to select one numbered record or abstain.
4. **Validation** rejects missing, malformed, out-of-range, or low-confidence choices.
5. **Rendering** shows the curated record, review date, operator, and leave-site disclosure.
6. **Abstention** is treated as a valid product outcome.

## Doctrine

The uploaded schema established five core invariants. They remain canonical:

- **I1 — No eligibility determination.** Records describe services, not users.
- **I2 — No answer without a resolvable record ID.** The result must exist in the record set.
- **I3 — Freshness is derived.** A record may not assert that it is current.
- **I4 — Escalations are deterministic.** The model cannot retrieve or select them.
- **I5 — Destination changes create a revision.** IDs remain stable and changes are recorded.

`portal/lint.py` turns several of these principles into build failures.

## Provider architecture

The canonical AI WORKS deployment uses one provider path:

- **OpenAI Chat Completions API**;
- pinned default model **`gpt-5-nano-2025-08-07`**;
- strict JSON Schema output;
- minimal reasoning and low verbosity;
- server-side key only;
- standard OpenAI endpoint or the OpenAI U.S. regional endpoint.

The provider module rejects non-OpenAI providers and arbitrary OpenAI-compatible endpoints. This is a permanent project decision documented in [`PROVIDER_POLICY.md`](PROVIDER_POLICY.md).

## Privacy

The project does not create accounts or write routing requests to a database. The request is sent to OpenAI for one constrained verification call. Hosting and OpenAI logs may still exist and are governed by those services and the project's account controls. Do not ask for Social Security numbers, case numbers, medical details, passwords, or other sensitive identifiers.

The preferred production posture is an eligible OpenAI U.S. data-residency project using `https://us.api.openai.com/v1`. Until that is available, using OpenAI's standard API establishes the U.S.-owned provider decision but should not be described as a guarantee of U.S.-only processing.

## Current record coverage

The U.S. seed includes common federal services, federal-to-state handoffs, one cross-agency survivor journey, and deterministic crisis or emergency paths. It is not complete.

A production maintainer must add:

- scheduled liveness checks;
- selector-scoped change fingerprints;
- a human review queue;
- a larger adversarial evaluation set;
- OpenAI model-snapshot comparison receipts before upgrades;
- accessibility and plain-language review;
- clear ownership for every record.

## Evaluation gates

The probe defines the right priority order:

1. answerable top-1 accuracy;
2. **confident-wrong rate**;
3. correct abstention;
4. latency;
5. zero missed escalations.

The product should not ship broadly because its average accuracy looks good. It should ship only when the dangerous error class is acceptably rare and observed across a large, difficult test set.
