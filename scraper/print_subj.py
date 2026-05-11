import json, sys

year = int(sys.argv[1]) if len(sys.argv) > 1 else 111
subj = sys.argv[2] if len(sys.argv) > 2 else 'company'

data = json.load(open(f'data/{year}_complete.json', 'r', encoding='utf-8'))
for d in data:
    if d['subject'] == subj:
        qn = d['questionNumber']
        ans = d['answer']
        qt = d.get('questionText', '')[:120]
        opts = d.get('options', {})
        print(f"Q{qn} ans={ans}")
        print(f"  {qt}")
        for k in ['A','B','C','D']:
            if k in opts:
                print(f"  {k}: {opts[k][:80]}")
        print()
