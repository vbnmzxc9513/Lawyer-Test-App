"""
fix_114_thorough.py - Thorough cleanup of ALL PUA/garbled chars + re-upload
"""
import json, re

data = json.load(open('data/114_complete.json', 'r', encoding='utf-8'))
pua = re.compile(r'[\ue000-\uf8ff]')

fixed_opts = 0
fixed_qt = 0
for q in data:
    for k in list(q.get('options', {}).keys()):
        v = q['options'][k]
        if v and pua.search(v):
            q['options'][k] = pua.sub('', v).strip()
            fixed_opts += 1
    qt = q.get('questionText', '')
    if qt and pua.search(qt):
        q['questionText'] = pua.sub('', qt).strip()
        fixed_qt += 1

print(f"Fixed {fixed_opts} option fields, {fixed_qt} questionText fields")

# Verify sample
for q in data[:3]:
    print(f"\n{q['id']}")
    for k, v in q['options'].items():
        has_pua = "PUA!" if pua.search(v) else "OK"
        print(f"  {k} [{has_pua}]: {v[:60]}")

# Save
with open('data/114_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("\nSaved.")
