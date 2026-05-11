"""
將 111-113 年的官方標準答案 PDF 轉為圖片，以便人工比對。
使用 PyMuPDF (fitz) 渲染 PDF 頁面為高解析度 PNG。
"""
import fitz
import os, sys

sys.stdout.reconfigure(encoding='utf-8')

for year in [111, 112, 113]:
    out_dir = f'pdfs/{year}/answer_images'
    os.makedirs(out_dir, exist_ok=True)
    
    for paper in ['301', '302', '303', '304']:
        pdf_path = f'pdfs/{year}/{paper}_answers.pdf'
        if not os.path.exists(pdf_path):
            print(f'SKIP: {pdf_path} not found')
            continue
        
        doc = fitz.open(pdf_path)
        for i, page in enumerate(doc):
            # Render at 2x resolution for clarity
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            img_path = f'{out_dir}/{paper}_ans_p{i+1}.png'
            pix.save(img_path)
            print(f'Saved: {img_path}')
        doc.close()

print('\nDone! Check pdfs/{year}/answer_images/ for PNG files.')
