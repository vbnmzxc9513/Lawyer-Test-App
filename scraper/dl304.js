const axios = require('axios');
const https = require('https');
const fs = require('fs');
const agent = new https.Agent({ rejectUnauthorized: false });

async function dl(url, file) {
  const r = await axios({ url, method: 'GET', responseType: 'arraybuffer', httpsAgent: agent, timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } });
  const h = Buffer.from(r.data).toString('ascii', 0, 5);
  if (h.startsWith('%PDF')) {
    fs.writeFileSync(file, Buffer.from(r.data));
    return r.data.byteLength;
  }
  return 'NOT_PDF';
}

async function main() {
  const base = 'https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx';
  const q = await dl(base + '?t=Q&code=113110&c=303&s=0202&q=1', 'pdfs/113/304_questions.pdf');
  const a = await dl(base + '?t=S&code=113110&c=303&s=0202&q=1', 'pdfs/113/304_answers.pdf');
  console.log('304 questions:', q, '304 answers:', a);
}

main().catch(console.error);
