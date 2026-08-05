#!/usr/bin/env python3
"""Build-failing linter for reviewed public-service records."""
import json, re, sys
from datetime import date
from pathlib import Path

ELIGIBILITY = [
    r"\byou (qualify|are eligible|will receive|can get|are entitled|should apply)\b",
    r"\byou'?re (eligible|entitled|qualified)\b", r"\bapplies to you\b",
]
BUREAUCRATESE = [r"\butiliz(e|ing|ation)\b", r"\bin order to\b", r"\bpursuant to\b", r"\bplease be advised\b"]
REQUIRED = {
    "service": ["destination"],
    "handoff": ["administration_level", "subtype", "federal_frame", "jurisdiction_prompt"],
    "journey": ["trigger", "steps", "not_exhaustive_notice"],
    "escalation": ["match", "channel", "contact"],
}

def load_records(source):
    path = Path(source)
    data = json.loads(path.read_text())
    if isinstance(data, list): return data
    if data.get("record_files"):
        records = []
        for name in data["record_files"]:
            chunk = json.loads((path.parent / name).read_text())
            records.extend(chunk if isinstance(chunk, list) else chunk["records"])
        return records
    return data["records"]

def syllables(word):
    word = re.sub(r"[^a-z]", "", word.lower())
    groups = re.findall(r"[aeiouy]+", word)
    count = len(groups)
    if word.endswith("e") and count > 1: count -= 1
    return max(count, 1) if word else 0

def grade(text):
    words = re.findall(r"[A-Za-z]+", text)
    sentences = max(len(re.findall(r"[.!?]+", text)), 1)
    if not words: return 0
    return .39 * (len(words) / sentences) + 11.8 * (sum(map(syllables, words)) / len(words)) - 15.59

def state(record):
    verification = record.get("verification", {})
    if verification.get("liveness", {}).get("last_ok") == "FAILED": return "broken"
    if verification.get("fingerprint", {}).get("drifted") is True: return "drifted"
    reviewed = verification.get("last_human_review")
    if reviewed and (date.today() - date.fromisoformat(reviewed)).days > verification.get("review_window_days", 180): return "stale"
    return "verified"

def lint(records):
    ids = {r.get("id") for r in records}
    failures = []
    def fail(rid, code, message): failures.append((rid, code, message))
    for r in records:
        rid, kind = r.get("id", "<missing>"), r.get("type")
        if not re.fullmatch(r"[a-z0-9]+\.[a-z0-9-]+", rid): fail(rid, "ID", "use stable namespaced lowercase id")
        for field in REQUIRED.get(kind, []):
            if field not in r: fail(rid, "MISSING", field)
        if "display_state" in r: fail(rid, "I3", "display_state must be derived")
        if len(r.get("aliases", [])) < 3: fail(rid, "ALIASES", "at least three vernacular aliases required")
        summary = r.get("plain_summary", "")
        if len(summary.split()) > 25: fail(rid, "LENGTH", "plain_summary exceeds 25 words")
        if grade(summary) > 8: fail(rid, "READING", f"grade {grade(summary):.1f} exceeds 8")
        visible = " ".join([summary, r.get("disclosure", {}).get("why", ""), r.get("not_exhaustive_notice", "")])
        for pattern in ELIGIBILITY:
            if re.search(pattern, visible, re.I): fail(rid, "I1", "eligibility determination language"); break
        for pattern in BUREAUCRATESE:
            if re.search(pattern, visible, re.I): fail(rid, "PLAIN", "bureaucratic wording"); break
        if kind == "journey":
            for step in r.get("steps", []):
                if step.get("record_id") not in ids: fail(rid, "I2", f"unresolved {step.get('record_id')}")
        if kind == "escalation":
            if not r.get("render_before_anything_else"): fail(rid, "I4", "must render before model")
            if not r.get("match", {}).get("patterns"): fail(rid, "I4", "deterministic patterns required")
        if kind == "handoff" and r.get("subtype") == "own_table" and len(r.get("jurisdictions", {})) < 50:
            fail(rid, "HANDOFF", "incomplete local jurisdiction table")
        r["_state"] = state(r)
    return failures

def main():
    records = load_records(sys.argv[1])
    failures = lint(records)
    print(f"\nlinted {len(records)} records\n" + "=" * 62)
    for r in records:
        route = "routable" if r["_state"] in {"verified", "stale"} else "NOT ROUTABLE"
        print(f"  {r['id']:<32} {r['type']:<11} {r['_state']:<9} {route}")
    if failures:
        print(f"\n{len(failures)} INVARIANT FAILURES\n" + "=" * 62)
        for rid, code, message in failures: print(f"  {rid:<32} {code:<10} {message}")
        sys.exit(1)
    print("\nall invariants hold.")

if __name__ == "__main__": main()
