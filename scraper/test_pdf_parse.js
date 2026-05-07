/**
 * test_pdf_parse.js - 測試 pdfjs-dist 能否正確解析考選部 PDF 中文
 */
const fs = require('fs');
const path = require('path');

async function testPdfjsDist() {
  // 動態 import pdfjs-dist (ESM)
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  const pdfPath = path.join(__dirname, 'pdfs', 'paper_1_1_questions.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('找不到測試 PDF:', pdfPath);
    return;
  }

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  
  console.log(`=== pdfjs-dist 測試 ===`);
  console.log(`總頁數: ${doc.numPages}`);
  console.log('');

  // 只讀取前 3 頁來測試
  for (let i = 1; i <= Math.min(3, doc.numPages); i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join('');
    console.log(`--- 第 ${i} 頁 (前 500 字) ---`);
    console.log(text.substring(0, 500));
    console.log('');
  }
}

testPdfjsDist().catch(console.error);
