"""
test_pymupdf.py - 測試 PyMuPDF 提取考古題文字品質
"""
import fitz
import json
import sys

pdf_path = r'D:\AI_Project\Lawyer_test_first\scraper\PastExam\113\考畢題答\113110_0301_綜合法學(一)(刑法.pdf'
doc = fitz.open(pdf_path)
print(f'Total pages: {len(doc)}', flush=True)

# Extract all text
all_text = []
for i, page in enumerate(doc):
    text = page.get_text()
    all_text.append(text)

# Write to file as UTF-8
with open('test_extract.txt', 'w', encoding='utf-8') as f:
    for i, text in enumerate(all_text):
        f.write(f'\n=== PAGE {i+1} ===\n')
        f.write(text)

print(f'Text extracted to test_extract.txt', flush=True)
print(f'Total chars: {sum(len(t) for t in all_text)}', flush=True)
