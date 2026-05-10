"""
extract_missing_questions.py (v2)
用 PyMuPDF 從考古題 PDF 提取缺失題目
處理 PUA 字符選項標記（\ue18c=A, \ue18d=B, \ue18e=C, \ue18f=D）
"""
import fitz
import json
import re
import os
import sys

BASE_DIR = r'D:\AI_Project\Lawyer_test_first\scraper\PastExam'
OUTPUT_DIR = r'D:\AI_Project\Lawyer_test_first\scraper\data'

# PUA 字符 → ABCD 映射
OPTION_MAP = {'\ue18c': 'A', '\ue18d': 'B', '\ue18e': 'C', '\ue18f': 'D'}

# 缺失清單
MISSING = {
    '111-0301': {'file': '111/考畢題答/111120_0301_綜合法學(一)(刑法.pdf', 'fsCode': '1301', 'qNums': [51]},
    '111-0202': {'file': '111/考畢題答/111120_0202_綜合法學(二)(公司.pdf', 'fsCode': '4301', 'qNums': list(range(53, 71))},
    '112-0301': {'file': '112/考畢題答/112120_0301_綜合法學(一)(刑法.pdf', 'fsCode': '1301', 'qNums': list(range(1, 51))},
    '112-0202': {'file': '112/考畢題答/112120_0202_綜合法學(二)(公司.pdf', 'fsCode': '4301', 'qNums': list(range(54, 71))},
    '113-0301': {'file': '113/考畢題答/113110_0301_綜合法學(一)(刑法.pdf', 'fsCode': '1301', 'qNums': list(range(1, 56))},
    '113-0201': {'file': '113/考畢題答/113110_0201_綜合法學(二)(民法.pdf', 'fsCode': '3301', 'qNums': [62]},
    '113-0202': {'file': '113/考畢題答/113110_0202_綜合法學(二)(公司.pdf', 'fsCode': '4301', 'qNums': [54]},
}

SUBJECT_MAP = {
    '2301': lambda q: 'constitutional' if q <= 20 else ('administrative' if q <= 55 else ('international_public' if q <= 65 else 'international_private')),
    '3301': lambda q: 'civil' if q <= 50 else 'civil_procedure',
    '4301': lambda q: 'company' if q <= 15 else ('insurance' if q <= 25 else ('negotiable_instruments' if q <= 35 else ('securities' if q <= 45 else ('enforcement' if q <= 55 else 'legal_english')))),
    '1301': lambda q: 'criminal' if q <= 50 else ('criminal_procedure' if q <= 65 else 'legal_ethics'),
}

ANSWER_CACHE = None
def load_answers():
    global ANSWER_CACHE
    p = os.path.join(os.path.dirname(__file__), 'pdf_answers_cache.json')
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            ANSWER_CACHE = json.load(f)


def extract_questions_from_pdf(pdf_path):
    """提取題目，處理 PUA 選項符號"""
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"
    doc.close()

    # 把全文按題號切分
    # 題號模式：行首數字 1~80，後接中文題目
    # 先將 PUA 選項符號替換為特殊標記
    for pua, letter in OPTION_MAP.items():
        full_text = full_text.replace(pua, f'\n__OPT_{letter}__')

    lines = full_text.split('\n')
    cleaned = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # 跳過頁首
        if re.match(r'^代號：\d+$', line):
            continue
        if re.match(r'^頁次：\d+－\d+$', line):
            continue
        if re.match(r'^11[0-9]年', line):
            continue
        if '考試時間' in line or '座號' in line or '注意' in line or '本科目共' in line or '禁止使用' in line:
            continue
        if re.match(r'^類\s*$|^科\s*$|^目\s*$', line):
            continue
        if re.match(r'^科\s*目：', line):
            continue
        cleaned.append(line)

    questions = {}
    i = 0
    while i < len(cleaned):
        line = cleaned[i]

        # 偵測題號
        if re.match(r'^\d{1,2}$', line):
            q_num = int(line)
            if 1 <= q_num <= 80:
                i += 1
                q_text_parts = []
                options = {}
                current_opt = None
                current_opt_parts = []

                while i < len(cleaned):
                    cur = cleaned[i]

                    # 下一個題號
                    if re.match(r'^\d{1,2}$', cur) and 1 <= int(cur) <= 80:
                        break

                    # 選項標記
                    opt_m = re.match(r'^__OPT_([A-D])__(.*)$', cur)
                    if opt_m:
                        # 儲存前一個選項
                        if current_opt:
                            options[current_opt] = ''.join(current_opt_parts).strip()
                        current_opt = opt_m.group(1)
                        current_opt_parts = [opt_m.group(2)] if opt_m.group(2) else []
                        i += 1
                        continue

                    # 舊格式選項（行首 A/B/C/D + 空格）
                    old_opt = re.match(r'^([A-D])\s+(.+)$', cur)
                    if old_opt and not current_opt:
                        if current_opt:
                            options[current_opt] = ''.join(current_opt_parts).strip()
                        current_opt = old_opt.group(1)
                        current_opt_parts = [old_opt.group(2)]
                        i += 1
                        continue

                    if current_opt:
                        current_opt_parts.append(cur)
                    else:
                        q_text_parts.append(cur)
                    i += 1

                # 儲存最後一個選項
                if current_opt:
                    options[current_opt] = ''.join(current_opt_parts).strip()

                questions[q_num] = {
                    'questionText': ''.join(q_text_parts).strip(),
                    'options': options,
                }
                continue
        i += 1

    return questions


def main():
    print("=" * 60)
    print("  Missing Questions Extractor (PyMuPDF v2)")
    print("=" * 60)

    load_answers()
    all_docs = []

    for paper_key, config in MISSING.items():
        year_str, pdf_code = paper_key.split('-')
        year = int(year_str)
        fs_code = config['fsCode']
        missing_nums = config['qNums']
        subject_fn = SUBJECT_MAP.get(fs_code, lambda q: 'unknown')

        pdf_path = os.path.join(BASE_DIR, config['file'])
        if not os.path.exists(pdf_path):
            print(f"[ERROR] PDF not found: {pdf_path}")
            continue

        print(f"\n[{paper_key}] {len(missing_nums)} missing questions")
        questions = extract_questions_from_pdf(pdf_path)
        print(f"  Extracted {len(questions)} total questions from PDF")

        # 取得答案
        ans_key = f"{year_str}-{pdf_code}"
        answers = {}
        if ANSWER_CACHE and ans_key in ANSWER_CACHE:
            answers = ANSWER_CACHE[ans_key].get('answers', {})

        docs = []
        for q_num in missing_nums:
            if q_num not in questions:
                print(f"  [WARN] Q{q_num} not found in PDF!")
                continue

            q = questions[q_num]
            subject = subject_fn(q_num)
            doc_id = f"{year}-{fs_code}-{subject}-{q_num:02d}"
            ans = answers.get(str(q_num), '')

            doc = {
                'id': doc_id,
                'year': year,
                'subject': subject,
                'questionNumber': q_num,
                'questionText': q['questionText'],
                'options': q['options'],
                'answer': ans,
            }
            docs.append(doc)

        all_docs.extend(docs)

        # Stats
        opts_ok = sum(1 for d in docs if len(d.get('options', {})) == 4)
        text_ok = sum(1 for d in docs if len(d.get('questionText', '')) > 10)
        ans_ok = sum(1 for d in docs if d.get('answer'))
        print(f"  Built {len(docs)} docs | text:{text_ok} opts:{opts_ok} ans:{ans_ok}")

        # Sample
        if docs:
            d = docs[0]
            print(f"  Sample Q{d['questionNumber']}: {d['questionText'][:60]}...")
            for k in ['A', 'B', 'C', 'D']:
                v = d['options'].get(k, '[MISSING]')
                print(f"    {k}: {v[:50]}...")

    # Save
    out = os.path.join(OUTPUT_DIR, 'missing_questions.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(all_docs, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 60}")
    print(f"  Total: {len(all_docs)} questions extracted")
    print(f"  Saved: {out}")
    print(f"  Next:  node upload_missing.js")


if __name__ == '__main__':
    main()
