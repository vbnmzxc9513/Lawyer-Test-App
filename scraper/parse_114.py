"""
parse_114_full.py - Parse 114年 exam PDFs into complete structured JSON
"""
import fitz, re, json, os

# Subject ranges per paper (question number ranges)
PAPER_MAP = {
    '301': [
        ('constitutional', 1, 20),
        ('administrative', 21, 56),
        ('international_public', 57, 66),
        ('international_private', 67, 75),
    ],
    '302': [
        ('criminal', 1, 40),
        ('criminal_procedure', 41, 60),
        ('legal_ethics', 61, 75),
    ],
    '303': [
        ('civil', 1, 50),
        ('civil_procedure', 51, 80),
    ],
    '304': [
        ('company', 1, 15),
        ('insurance', 16, 25),
        ('negotiable_instruments', 26, 35),
        ('securities', 36, 45),
        ('enforcement', 46, 55),
        ('legal_english', 56, 70),
    ],
}

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    text = ''
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def parse_questions(text):
    """Parse exam text into structured questions"""
    # Clean header/footer noise
    text = re.sub(r'代號：\d+\s*\n\s*頁次：[\d－]+\s*\n?', '\n', text)
    text = re.sub(r'114年.*?第一試.*?\n', '', text)
    text = re.sub(r'考試時間.*?\n', '', text)
    text = re.sub(r'注意事項.*?(?=\n\d)', '', text, flags=re.DOTALL)
    
    # Split into individual questions
    # Pattern: starts with a number at beginning of line, followed by newline and question text
    # Questions are separated by their numbers
    parts = re.split(r'\n(\d{1,3})\n', text)
    
    questions = {}
    
    i = 1
    while i < len(parts) - 1:
        try:
            qnum = int(parts[i])
        except ValueError:
            i += 1
            continue
            
        body = parts[i + 1].strip()
        
        # Find the next question number to know where this question ends
        # The body contains question text + options
        # Options appear as lines starting with option markers or 4 consecutive short lines
        
        lines = body.split('\n')
        
        # Try to identify option lines (they're usually shorter and at the end)
        # Options might not have explicit A/B/C/D markers in the PDF
        # They appear as separate lines after the question text
        
        # Strategy: work backwards from end to find 4 option lines
        clean_lines = [l.strip() for l in lines if l.strip()]
        
        if len(clean_lines) >= 5:
            # Check if last 4 lines look like options (each is a complete statement)
            # The question text is everything before the last 4 lines
            opt_d = clean_lines[-1]
            opt_c = clean_lines[-2]
            opt_b = clean_lines[-3]
            opt_a = clean_lines[-4]
            q_text = '\n'.join(clean_lines[:-4])
            
            # Handle multi-line options (option text that wraps)
            # If any option is very short, it might be continuation of previous
            # For now, use simple 4-line assumption
            
            questions[qnum] = {
                'questionText': q_text.replace('\n', ''),
                'options': {
                    'A': opt_a,
                    'B': opt_b,
                    'C': opt_c,
                    'D': opt_d,
                }
            }
        elif len(clean_lines) >= 2:
            # Too few lines - store what we have
            questions[qnum] = {
                'questionText': '\n'.join(clean_lines),
                'options': {'A': '', 'B': '', 'C': '', 'D': ''}
            }
        
        i += 2
    
    return questions

# Load answers
with open('pdfs/114/parsed_answers.json', 'r') as f:
    all_answers = json.load(f)

all_questions = []
stats = {}

for paper_code, subjects in PAPER_MAP.items():
    text = extract_text(f'pdfs/114/{paper_code}_questions.pdf')
    parsed = parse_questions(text)
    answers = all_answers[paper_code]
    
    print(f"\n=== Paper {paper_code} ===")
    print(f"Parsed {len(parsed)} questions from PDF")
    print(f"Have {len(answers)} answers")
    
    for subject_code, start_q, end_q in subjects:
        count = 0
        for qn in range(start_q, end_q + 1):
            ans_idx = qn - 1
            answer = answers[ans_idx] if ans_idx < len(answers) else '?'
            
            qnum_str = str(qn).zfill(2)
            
            if qn in parsed:
                q_data = parsed[qn]
                q_text = q_data['questionText']
                options = q_data['options']
            else:
                q_text = f'114年第{qn}題（PDF解析待補）'
                options = {'A': '選項A', 'B': '選項B', 'C': '選項C', 'D': '選項D'}
            
            question = {
                'id': f'114-{paper_code}-{subject_code}-{qnum_str}',
                'year': 114,
                'subject': subject_code,
                'questionNumber': qn,
                'questionText': q_text,
                'options': options,
                'answer': answer,
                'tags': []
            }
            all_questions.append(question)
            count += 1
        
        stats[subject_code] = count
        print(f"  {subject_code}: Q{start_q}-Q{end_q} = {count} questions")

# Save
os.makedirs('data', exist_ok=True)
with open('data/114_complete.json', 'w', encoding='utf-8') as f:
    json.dump(all_questions, f, ensure_ascii=False, indent=2)

print(f"\n{'='*50}")
print(f"Total: {len(all_questions)} questions")
print(f"Saved to data/114_complete.json")
print(f"\nSubject distribution:")
for s, c in sorted(stats.items()):
    print(f"  {s}: {c}")

# Spot check first few
print(f"\n--- Spot Check (first 3 questions) ---")
for q in all_questions[:3]:
    print(f"\n{q['id']} ans={q['answer']}")
    print(f"  {q['questionText'][:100]}")
    for k, v in q['options'].items():
        print(f"  {k}: {v[:60]}")
