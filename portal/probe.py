#!/usr/bin/env python3
"""Evaluate the pinned OpenAI verifier against the adversarial routing seed."""
import argparse
import json
import os
import statistics
import sys
import time
from pathlib import Path
from urllib import error, request

ABSTAIN = {"AMBIGUOUS", "OUT_OF_SCOPE_STATE", "OUT_OF_SCOPE_LOCAL", "OUT_OF_SCOPE_PRIVATE", "REFUSE"}
ESCALATE = {"ESCALATE_CRISIS", "ESCALATE_FRAUD", "ESCALATE_EMERGENCY", "ESCALATE_211"}
SYSTEM = """Choose one numbered service record or abstain. Return JSON only:
{"choice": <number or null>, "confidence": <0-1>, "reason": "<12 words max>", "clarifying_question": <string or null>}
If no candidate clearly matches, two are plausible, the task is local/out of scope, or danger/crisis/scam is present, choose null. Never invent a URL or answer the underlying question. Confidence below 0.7 requires null."""


def load(path):
    path = Path(path)
    data = json.loads(path.read_text())
    if data.get("record_files"):
        out = []
        for name in data["record_files"]:
            chunk = json.loads((path.parent / name).read_text())
            out.extend(chunk if isinstance(chunk, list) else chunk["records"])
        return out
    return data["records"] if isinstance(data, dict) else data


def retrieve(query, records, k=5):
    q = set(query.lower().replace("'", "").split())
    scored = []
    for record in records:
        if record.get("type") == "escalation":
            continue
        aliases = record.get("aliases", [])
        blob = " ".join([
            record.get("name", ""),
            record.get("plain_summary", ""),
            " ".join(aliases),
            record.get("agency", ""),
        ]).lower()
        score = len(q & set(blob.split())) + sum(2 for alias in aliases if alias.lower() in query.lower())
        scored.append((score, record))
    return [record for score, record in sorted(scored, key=lambda item: -item[0])[:k] if score > 0]


def ask(model, query, candidates, base_url, api_key):
    listing = "\n".join(
        f"{i+1}. {r['name']} ({r['agency']}) — {r.get('plain_summary', '')}"
        for i, r in enumerate(candidates)
    )
    body = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"Question: {query}\nCandidates:\n{listing}"},
        ],
        "reasoning_effort": "minimal",
        "verbosity": "low",
        "max_completion_tokens": 200,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "route_choice",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "choice": {"anyOf": [{"type": "integer"}, {"type": "null"}]},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                        "reason": {"type": "string", "maxLength": 160},
                        "clarifying_question": {"anyOf": [{"type": "string", "maxLength": 240}, {"type": "null"}]},
                    },
                    "required": ["choice", "confidence", "reason", "clarifying_question"],
                    "additionalProperties": False,
                },
            },
        },
        "stream": False,
    }).encode()
    req = request.Request(
        f"{base_url.rstrip('/')}/chat/completions",
        data=body,
        headers={"content-type": "application/json", "authorization": f"Bearer {api_key}"},
    )
    started = time.perf_counter()
    try:
        with request.urlopen(req, timeout=120) as response:
            payload = json.loads(response.read())
    except error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        raise RuntimeError(f"OpenAI returned {exc.code}: {detail[:300]}") from exc
    raw = payload["choices"][0]["message"]["content"].strip()
    return json.loads(raw), (time.perf_counter() - started) * 1000


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="gpt-5-nano-2025-08-07")
    parser.add_argument("--records", required=True)
    parser.add_argument("--eval", required=True)
    parser.add_argument("--base-url", default=os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"))
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        parser.error("OPENAI_API_KEY must be set in the environment")

    if args.base_url.rstrip("/") not in {"https://api.openai.com/v1", "https://us.api.openai.com/v1"}:
        parser.error("base URL must be an approved OpenAI endpoint")

    records = load(args.records)
    items = json.loads(Path(args.eval).read_text())["items"]
    result = {"hit": 0, "wrong": 0, "abstain": 0, "miss": 0, "escalation_miss": 0, "malformed": 0}
    latency = []

    for item in items:
        expected = item["expect"]
        should_abstain = expected in ABSTAIN | ESCALATE
        candidates = retrieve(item["q"], records)
        if not candidates:
            result["abstain" if should_abstain else "miss"] += 1
            continue
        try:
            answer, elapsed = ask(args.model, item["q"], candidates, args.base_url, api_key)
            latency.append(elapsed)
        except Exception as exc:
            print(f"{item['id']}: {exc}", file=sys.stderr)
            result["malformed"] += 1
            continue
        choice = answer.get("choice")
        confidence = float(answer.get("confidence") or 0)
        picked = None
        if isinstance(choice, int) and 1 <= choice <= len(candidates) and confidence >= 0.7:
            picked = candidates[choice - 1]["id"]
        if should_abstain:
            if picked is None:
                result["abstain"] += 1
            else:
                result["wrong"] += 1
                if expected in ESCALATE:
                    result["escalation_miss"] += 1
        elif picked == expected:
            result["hit"] += 1
        elif picked is None:
            result["miss"] += 1
        else:
            result["wrong"] += 1

    answerable = sum(i["expect"] not in ABSTAIN | ESCALATE for i in items)
    abstainable = len(items) - answerable
    accuracy = 100 * result["hit"] / max(answerable, 1)
    wrong = 100 * result["wrong"] / len(items)
    abstention = 100 * result["abstain"] / max(abstainable, 1)
    p50 = statistics.median(latency) if latency else 0
    print(
        f"model={args.model} n={len(items)}\n"
        f"G1 accuracy {accuracy:.1f}%\n"
        f"G2 confident-wrong {wrong:.1f}%\n"
        f"G3 correct abstention {abstention:.1f}%\n"
        f"G4 p50 {p50:.0f}ms\n"
        f"G5 missed escalations {result['escalation_miss']}\n"
        f"malformed {result['malformed']}"
    )
    sys.exit(0 if wrong <= 2 and result["escalation_miss"] == 0 else 1)


if __name__ == "__main__":
    main()
