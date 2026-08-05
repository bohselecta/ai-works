# OpenAI model and cost policy

Checked **August 5, 2026** against official OpenAI documentation. Prices and product eligibility can change; verify before budgeting or changing a pinned model.

## Permanent provider decision

The canonical AI WORKS deployment uses the **OpenAI API only**. The default model is pinned rather than aliased:

```env
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-5-nano-2025-08-07
OPENAI_BASE_URL=https://api.openai.com/v1
```

For an OpenAI project approved for U.S. data residency:

```env
OPENAI_BASE_URL=https://us.api.openai.com/v1
```

See [`PROVIDER_POLICY.md`](PROVIDER_POLICY.md).

## Current rate used for estimates

OpenAI lists GPT-5 nano at:

- **$0.05 per million input tokens**
- **$0.40 per million output tokens**

The router sends a short request plus at most six locally retrieved candidate records. The model returns only a constrained JSON choice or abstention. The request uses minimal reasoning, low verbosity, and a hard completion ceiling of 200 tokens.

### Conservative request estimate

Assuming **700–1,200 input tokens** and the full **200-token completion ceiling**:

| Volume | Estimated model cost |
|---:|---:|
| One route | $0.000115–$0.000140 |
| 1,000 routes | $0.12–$0.14 |
| 100,000 routes | $11.50–$14.00 |
| 1,000,000 routes | $115–$140 |

Most valid responses should use fewer than 200 completion tokens, so observed cost may be lower. Reasoning tokens count toward model output usage. This estimate excludes retries, hosting, monitoring, taxes, future price changes, and traffic abuse.

## Cost controls in the application

- deterministic emergency routing occurs before any model call;
- only six locally retrieved candidates are sent to OpenAI;
- structured output prevents prose generation;
- reasoning effort is set to `minimal`;
- output is capped;
- input length is capped server-side;
- the endpoint includes a best-effort request-rate limit; and
- a provider failure produces abstention rather than a retry loop or improvised answer.

## Data handling

The browser never receives the API key. The project does not create accounts or intentionally persist routing requests.

OpenAI states that API data is not used to train its models unless the customer opts in. Standard Chat Completions may retain abuse-monitoring logs for up to 30 days. Eligible organizations can pursue Zero Data Retention or Modified Abuse Monitoring controls. OpenAI's U.S. regional endpoint supports regional storage and processing for supported services and models.

Do not ask users to submit Social Security numbers, passwords, case numbers, medical records, or other sensitive identifiers.

## Model-change rule

The provider is permanent. The model is pinned but replaceable after evidence.

Before changing `OPENAI_MODEL` in the canonical deployment:

1. run the adversarial evaluation;
2. compare the proposed OpenAI snapshot against the current snapshot;
3. publish accuracy, confident-wrong, correct-abstention, escalation, latency, and cost receipts;
4. update this file and the provider-policy decision; and
5. obtain project-owner approval.

## Official references

- OpenAI GPT-5 developer announcement and pricing: <https://openai.com/index/introducing-gpt-5-for-developers/>
- OpenAI API data controls and regional processing: <https://developers.openai.com/api/docs/guides/your-data>
