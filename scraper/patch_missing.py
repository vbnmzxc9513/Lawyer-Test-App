"""
patch_missing.py - 手動修補 4 個提取有問題的題目
"""
import json
import os

data_path = os.path.join(os.path.dirname(__file__), 'data', 'missing_questions.json')
with open(data_path, 'r', encoding='utf-8') as f:
    docs = json.load(f)

# Build index by id
idx = {d['id']: d for d in docs}

# 1. Q23 112-1301-criminal-23: missing option A
# From raw PDF: "甲為與A 性交，乃趁A 不注意，在A 的飲料中放入安眠藥..."
d = idx.get('112-1301-criminal-23')
if d:
    d['options']['A'] = '甲為與A 性交，乃趁A 不注意，在A 的飲料中放入安眠藥，導致A 昏迷不醒，甲再與A 性交，則因性交時A 處於不知或不能抗拒的狀態，甲成立本罪'
    print(f"Fixed {d['id']}: added option A")

# 2. Q6 113-1301-criminal-06: missing option D
# From raw PDF text: "在過失不作為犯的情形，依實務見解，過失犯的注意義務和不作為犯的作為義務屬於不同層次問題，不得混為一談"
d = idx.get('113-1301-criminal-06')
if d:
    d['options']['D'] = '在過失不作為犯的情形，依實務見解，過失犯的注意義務和不作為犯的作為義務屬於不同層次問題，不得混為一談'
    print(f"Fixed {d['id']}: added option D")

# 3. Q62 112-4301-legal_english-62: missing text and options
d = idx.get('112-4301-legal_english-62')
if d:
    d['questionText'] = "A director of a company limited by shares may be ___ at will by a special resolution of a shareholders' meeting."
    d['options'] = {
        'A': 'discontinued',
        'B': 'discharged',
        'C': 'disqualified',
        'D': 'waived',
    }
    print(f"Fixed {d['id']}: added text + options")

# 4. Q70 112-4301-legal_english-70: missing text
d = idx.get('112-4301-legal_english-70')
if d:
    d['questionText'] = 'A Justice who agrees with the holding of the decision but is not fully satisfied with its reasoning may issue a ___ opinion.'
    d['options'] = {
        'A': 'dissenting',
        'B': 'minority',
        'C': 'concurring',
        'D': 'differential',
    }
    print(f"Fixed {d['id']}: added text + options")

# Save
with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(docs, f, ensure_ascii=False, indent=2)

print(f"\nSaved {len(docs)} docs to {data_path}")
