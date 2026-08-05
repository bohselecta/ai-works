# Model cost notes

Checked **August 5, 2026** against provider documentation and pricing pages. Prices change; verify before budgeting.

## Recommended default: SiliconFlow

The router uses an OpenAI-compatible chat-completions request and sends only the user's short request plus the six retrieved candidate records. The model returns a small JSON object selecting one record or abstaining.

Suggested deployment configuration:

```env
LLM_PROVIDER=siliconflow
LLM_API_KEY=your-key
LLM_MODEL=Qwen/Qwen3.5-9B
LLM_BASE_URL=https://api.siliconflow.com/v1
```

SiliconFlow currently lists `Qwen/Qwen3.5-9B` at:

- **$0.10 per million input tokens**
- **$0.15 per million output tokens**

A normal router request is expected to use approximately **700–1,200 input tokens** and fewer than **100 output tokens**. At the listed rate, that is approximately **$0.000085–$0.000135 per route**, or roughly **$0.09–$0.14 per 1,000 routes**, before retries, provider changes, or unusually long inputs. This is an engineering estimate, not a billing guarantee.

## fal / OpenRouter

fal exposes an OpenAI-compatible LLM endpoint through OpenRouter:

```env
LLM_PROVIDER=fal
LLM_API_KEY=your-key
LLM_MODEL=google/gemini-2.5-flash
LLM_BASE_URL=https://fal.run/openrouter/router/openai/v1
```

The exact cost follows the selected OpenRouter model and can change independently. Consult fal and OpenRouter pricing before deployment.

## Cost controls already in the application

- deterministic emergency routing occurs before any model call;
- only six locally retrieved candidates are sent to the model;
- the model is limited to a small structured response;
- input length is capped server-side;
- the Vercel endpoint includes a best-effort request-rate limit; and
- a model failure produces abstention rather than a retry loop or improvised answer.

## Security

Never place the provider key in browser code or commit it to GitHub. Add it as a Vercel project environment variable or keep it in an ignored local `.env.local` file.

## Official references

- SiliconFlow API: <https://docs.siliconflow.com/en/api-reference/chat-completions/chat-completions>
- SiliconFlow pricing and model catalog: <https://siliconflow.com/pricing>
- fal OpenRouter endpoint: <https://fal.ai/models/openrouter/router/openai/api>
- fal pricing: <https://docs.fal.ai/model-apis/model-endpoints/pricing>
