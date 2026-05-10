import json
from collections import Counter

with open('data/missing_questions.json', 'r', encoding='utf-8') as f:
    docs = json.load(f)

bad = []
for d in docs:
    qn = d.get('questionNumber', 0)
    did = d.get('id', '?')
    qt = d.get('questionText', '')
    opts = d.get('options', {})
    ans = d.get('answer', '')
    
    if not qt or len(qt) < 10:
        bad.append(f"Q{qn} {did}: text too short ({len(qt)})")
    if len(opts) < 4:
        bad.append(f"Q{qn} {did}: only {len(opts)} options {list(opts.keys())}")
    if not ans:
        bad.append(f"Q{qn} {did}: no answer")

print(f"Total docs: {len(docs)}")
print(f"Issues: {len(bad)}")
for b in bad[:30]:
    print(f"  {b}")

c = Counter(d['subject'] for d in docs)
print("\nBy subject:")
for s, n in c.most_common():
    print(f"  {s}: {n}")

# 按年份統計
yc = Counter(d['year'] for d in docs)
print("\nBy year:")
for y, n in sorted(yc.items()):
    print(f"  {y}: {n}")
