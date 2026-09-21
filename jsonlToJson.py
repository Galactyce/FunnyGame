import json, sys
from collections import Counter
from pathlib import Path

src = Path(sys.argv[1])
recs, bad = [], 0
for i, line in enumerate(src.read_bytes().decode("utf-8-sig").splitlines(), 1):
    line = line.strip()
    if not line:
        continue
    try:
        recs.append(json.loads(line))
    except json.JSONDecodeError as e:
        bad += 1
        print(f"  unparseable line {i}: {e}")

print("kinds:", Counter(r.get("kind") for r in recs), "| bad lines:", bad)

base_idx = max(i for i, r in enumerate(recs) if r.get("kind") == 0)
session = recs[base_idx]["v"]
print("snapshot requests:", len(session.get("requests", [])))

def parent_of(root, path):
    cur = root
    for key in path[:-1]:
        cur = cur[key]
    return cur, path[-1]

applied = failed = 0
for r in recs[base_idx + 1:]:
    k = r.get("k")
    if not k:
        continue
    try:
        parent, last = parent_of(session, k)
        if r["kind"] == 1:                       # set
            parent[last] = r.get("v")
        elif r["kind"] == 2:                     # splice / push
            arr = parent[last]
            items = r.get("v", [])
            if not isinstance(items, list):
                items = [items]
            start = r.get("i", len(arr))
            arr[start:start + r.get("d", 0)] = items
        applied += 1
    except Exception as e:
        failed += 1
        print("  skipped:", json.dumps(r)[:140], "->", e)

print(f"applied {applied}, failed {failed}, final requests: {len(session.get('requests', []))}")

out = src.with_suffix(".json")
out.write_text(json.dumps(session, ensure_ascii=False), encoding="utf-8")
print("wrote", out)