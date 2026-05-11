"""
fix_114_options.py - Fix truncated options by re-reading PDF with better logic
Identifies questions where options got split across lines and merges them
"""
import fitz, re, json

def extract_questions_improved(pdf_path):
    """Extract questions with improved multi-line option handling"""
    doc = fitz.open(pdf_path)
    full_text = ''
    for page in doc:
        full_text += page.get_text()
    doc.close()
    
    # Remove headers/footers
    full_text = re.sub(r'代號：\d+\s*\n\s*頁次：[\d－]+\s*\n?', '\n', full_text)
    full_text = re.sub(r'114年.*?第一試.*?\n', '', full_text)
    
    # Split by question numbers at start of line
    parts = re.split(r'\n(\d{1,3})\n', full_text)
    
    questions = {}
    i = 1
    while i < len(parts) - 1:
        try:
            qnum = int(parts[i])
        except ValueError:
            i += 1
            continue
        
        body = parts[i + 1].strip()
        lines = [l.strip() for l in body.split('\n') if l.strip()]
        
        # Remove PUA characters
        lines = [re.sub(r'[\ue000-\uf8ff]', '', l).strip() for l in lines]
        lines = [l for l in lines if l]
        
        if len(lines) >= 5:
            # Strategy: Find where options start
            # Options are the last 4 "semantic units" - but some may span 2 lines
            # Heuristic: if a line is very short and follows a longer line, it's continuation
            
            # Merge continuation lines first
            merged = []
            for l in lines:
                # If line starts with a common continuation pattern (no period, short)
                if merged and len(l) < 30 and not any(l.startswith(p) for p in ['依', '關於', '下列', '有關', '依據', '甲', '乙', '丙', '丁', '國家', '人民', '行政', '法院', '被告', '原告']):
                    merged[-1] = merged[-1] + l
                else:
                    merged.append(l)
            
            if len(merged) >= 5:
                options = {
                    'A': merged[-4],
                    'B': merged[-3],
                    'C': merged[-2],
                    'D': merged[-1],
                }
                qtext = ''.join(merged[:-4])
            else:
                # Fallback: take last 4 lines as-is
                options = {
                    'A': lines[-4] if len(lines) >= 4 else '',
                    'B': lines[-3] if len(lines) >= 3 else '',
                    'C': lines[-2] if len(lines) >= 2 else '',
                    'D': lines[-1] if len(lines) >= 1 else '',
                }
                qtext = ''.join(lines[:-4]) if len(lines) > 4 else ''
            
            questions[qnum] = {'questionText': qtext, 'options': options}
        
        i += 2
    
    return questions

# Load current data
data = json.load(open('data/114_complete.json', 'r', encoding='utf-8'))

# Re-parse all 4 papers
fixes = 0
for paper in ['301', '302', '303', '304']:
    parsed = extract_questions_improved(f'pdfs/114/{paper}_questions.pdf')
    
    for q in data:
        if q.get('paperCode') == paper or q['id'].split('-')[1] == paper:
            qn = q['questionNumber']
            if qn in parsed:
                new_q = parsed[qn]
                old_opts = q['options']
                new_opts = new_q['options']
                
                # Check if any option was truncated (very short or empty)
                needs_fix = False
                for k in ['A', 'B', 'C', 'D']:
                    old_v = old_opts.get(k, '')
                    if len(old_v) < 5 and k != 'D':  # Very short option likely truncated
                        needs_fix = True
                    if old_v != new_opts.get(k, '') and len(new_opts.get(k, '')) > len(old_v):
                        needs_fix = True
                
                # Also check questionText
                old_qt = q.get('questionText', '')
                new_qt = new_q.get('questionText', '')
                
                if needs_fix or (len(new_qt) > len(old_qt) + 10):
                    # Update
                    q['questionText'] = new_qt if len(new_qt) > 10 else old_qt
                    for k in ['A', 'B', 'C', 'D']:
                        if len(new_opts.get(k, '')) >= len(old_opts.get(k, '')):
                            q['options'][k] = new_opts[k]
                    fixes += 1

# Final PUA cleanup
pua = re.compile(r'[\ue000-\uf8ff]')
for q in data:
    q['questionText'] = pua.sub('', q.get('questionText', '')).strip()
    for k in list(q.get('options', {}).keys()):
        q['options'][k] = pua.sub('', q['options'].get(k, '')).strip()

# Save
with open('data/114_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Fixed {fixes} questions with improved parsing")
print(f"All PUA characters cleaned")

# Verify some previously problematic questions
for qid in ['114-301-constitutional-06', '114-301-constitutional-07', '114-301-administrative-23']:
    q = next((x for x in data if x['id'] == qid), None)
    if q:
        print(f"\n{q['id']}:")
        print(f"  Q: {q['questionText'][:80]}")
        for k, v in q['options'].items():
            print(f"  {k}: {v[:60]}")
