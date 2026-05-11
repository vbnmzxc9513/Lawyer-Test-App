import json

data = json.load(open('data/114_complete.json', 'r', encoding='utf-8'))

# Check first 3 questions
for q in data[:3]:
    print(f"\n{q['id']}")
    for k, v in q['options'].items():
        if v:
            print(f"  {k}: ord(0)={ord(v[0])} hex={hex(ord(v[0]))} [{v[:50]}]")
