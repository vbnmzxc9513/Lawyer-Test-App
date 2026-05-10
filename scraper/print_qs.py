import json

with open('data/missing_questions.json', 'r', encoding='utf-8') as f:
    docs = json.load(f)

for d in docs:
    if d['year'] == 112 and d['subject'] == 'criminal' and 11 <= d['questionNumber'] <= 20:
        qn = d['questionNumber']
        print(f"Q{qn} ans={d['answer']}")
        print(f"  {d['questionText'][:100]}")
        for k in ['A', 'B', 'C', 'D']:
            v = d['options'].get(k, '')
            print(f"  {k}: {v[:70]}")
        print()
