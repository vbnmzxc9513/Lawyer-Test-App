"""
fix_114_garbled.py - Remove garbled PUA characters from 114年 options
Then re-upload fixed data to Firestore
"""
import json, re

data = json.load(open('data/114_complete.json', 'r', encoding='utf-8'))

fixed = 0
for q in data:
    for k in ['A', 'B', 'C', 'D']:
        if k in q['options'] and q['options'][k]:
            old = q['options'][k]
            # Remove PUA chars (U+E000-U+F8FF) and other control chars
            new = re.sub(r'[\ue000-\uf8ff]', '', old).strip()
            if new != old:
                q['options'][k] = new
                fixed += 1
    
    # Also clean questionText
    if q.get('questionText'):
        old = q['questionText']
        new = re.sub(r'[\ue000-\uf8ff]', '', old).strip()
        if new != old:
            q['questionText'] = new
            fixed += 1

with open('data/114_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Fixed {fixed} fields")
print(f"Sample after fix:")
for q in data[:2]:
    print(f"  {q['id']}")
    for k, v in q['options'].items():
        print(f"    {k}: {v[:50]}")
