/**
 * dl304_all.js - 下載所有年份的試卷304
 * 使用 c=303, s=0202 的特殊參數組合
 */
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

const agent = new https.Agent({ rejectUnauthorized: false });
const BASE = 'https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx';

const years = [
  { year: 113, code: '113110' },
  { year: 112, code: '112120' },
  { year: 111, code: '111120' },
];

async function dl(url, file) {
  try {
    const r = await axios({ url, method: 'GET', responseType: 'arraybuffer', httpsAgent: agent, timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const h = Buffer.from(r.data).toString('ascii', 0, 5);
    if (h.startsWith('%PDF')) {
      fs.writeFileSync(file, Buffer.from(r.data));
      return r.data.byteLength;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  for (const { year, code } of years) {
    const dir = path.join(__dirname, 'pdfs', String(year));
    console.log(`\n📥 下載 ${year} 年試卷304...`);

    // 嘗試多種參數組合
    const combos = [
      { c: '303', s: '0202' },
      { c: '304', s: '0202' },
      { c: '303', s: '0203' },
      { c: '304', s: '0203' },
    ];

    let found = false;
    for (const { c, s } of combos) {
      const qUrl = `${BASE}?t=Q&code=${code}&c=${c}&s=${s}&q=1`;
      const size = await dl(qUrl, path.join(dir, '304_questions.pdf'));
      if (size) {
        console.log(`  ✅ 試題 (c=${c}, s=${s}): ${size} bytes`);
        const aUrl = `${BASE}?t=S&code=${code}&c=${c}&s=${s}&q=1`;
        const aSize = await dl(aUrl, path.join(dir, '304_answers.pdf'));
        if (aSize) console.log(`  ✅ 答案: ${aSize} bytes`);
        found = true;
        break;
      }
    }
    if (!found) console.log(`  ❌ ${year} 年 304 無法下載`);
  }
}

main().catch(console.error);
