/**
 * download.js - 智慧下載器
 * 
 * 用法：
 *   node download.js --year 113    下載指定年份
 *   node download.js --all         下載所有已登錄年份
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

const registry = require('../config/exam-registry.json');
const BASE_URL = 'https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx';
const AGENT = new https.Agent({ rejectUnauthorized: false });

// 解析命令列參數
const args = process.argv.slice(2);
let targetYears = [];

if (args.includes('--all')) {
  targetYears = registry.exams.map(e => e.rocYear);
} else if (args.includes('--year')) {
  const yearIdx = args.indexOf('--year');
  const year = parseInt(args[yearIdx + 1]);
  if (isNaN(year)) {
    console.error('❌ 請指定有效年份，例如: node download.js --year 113');
    process.exit(1);
  }
  targetYears = [year];
} else {
  console.log('用法：');
  console.log('  node download.js --year 113    下載指定年份');
  console.log('  node download.js --all         下載所有已登錄年份');
  process.exit(0);
}

async function downloadFile(url, filepath) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      httpsAgent: AGENT,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // 檢查是否是有效的 PDF (以 %PDF 開頭)
    const header = Buffer.from(response.data).toString('ascii', 0, 5);
    if (!header.startsWith('%PDF')) {
      console.warn(`  ⚠️ 非 PDF 格式，跳過: ${path.basename(filepath)}`);
      return false;
    }

    fs.writeFileSync(filepath, Buffer.from(response.data));
    const sizeKB = (response.data.byteLength / 1024).toFixed(1);
    console.log(`  ✅ ${path.basename(filepath)} (${sizeKB} KB)`);
    return true;
  } catch (error) {
    console.error(`  ❌ 下載失敗 ${path.basename(filepath)}: ${error.message}`);
    return false;
  }
}

async function downloadYear(examInfo) {
  const { rocYear, examCode, papers } = examInfo;
  const yearDir = path.join(__dirname, 'pdfs', String(rocYear));

  if (!fs.existsSync(yearDir)) {
    fs.mkdirSync(yearDir, { recursive: true });
  }

  console.log(`\n📥 開始下載 ${rocYear} 年 (代碼: ${examCode}) ...`);

  // 下載「全部標準答案合集」(有些年份提供這份)
  const allAnswersUrl = `${BASE_URL}?t=A&code=${examCode}`;
  await downloadFile(allAnswersUrl, path.join(yearDir, `all_answers.pdf`));

  let downloadedCount = 0;
  let failedCount = 0;

  for (const paper of papers) {
    console.log(`\n  📄 試卷 ${paper.code}: ${paper.name}`);

    // 每份試卷只取第一個 subject code 的試題和答案
    // (同一份卷的不同 subject code 通常指向同一個 PDF)
    const s = paper.subjects[0];

    // 下載試題
    const qUrl = `${BASE_URL}?t=Q&code=${examCode}&c=${paper.code}&s=${s}&q=1`;
    const qFile = path.join(yearDir, `${paper.code}_questions.pdf`);
    const qOk = await downloadFile(qUrl, qFile);
    if (qOk) downloadedCount++; else failedCount++;

    // 下載標準答案
    const sUrl = `${BASE_URL}?t=S&code=${examCode}&c=${paper.code}&s=${s}&q=1`;
    const sFile = path.join(yearDir, `${paper.code}_answers.pdf`);
    const aOk = await downloadFile(sUrl, sFile);
    if (aOk) downloadedCount++; else failedCount++;

    // 嘗試下載更正答案 (不一定存在)
    const mUrl = `${BASE_URL}?t=M&code=${examCode}&c=${paper.code}&s=${s}&q=1`;
    const mFile = path.join(yearDir, `${paper.code}_corrected.pdf`);
    await downloadFile(mUrl, mFile);

    // 小延遲避免被伺服器擋
    await new Promise(r => setTimeout(r, 500));
  }

  // 寫入狀態檔
  const status = {
    year: rocYear,
    examCode,
    downloadedAt: new Date().toISOString(),
    downloaded: downloadedCount,
    failed: failedCount,
    papers: papers.map(p => p.code)
  };
  fs.writeFileSync(path.join(yearDir, 'status.json'), JSON.stringify(status, null, 2));

  console.log(`\n✅ ${rocYear} 年下載完成: ${downloadedCount} 成功, ${failedCount} 失敗`);
}

async function main() {
  console.log('🚀 司律一試考古題 PDF 下載器');
  console.log(`目標年份: ${targetYears.join(', ')}`);

  for (const year of targetYears) {
    const examInfo = registry.exams.find(e => e.rocYear === year);
    if (!examInfo) {
      console.error(`❌ 找不到 ${year} 年的考試資料，請確認 exam-registry.json`);
      continue;
    }
    await downloadYear(examInfo);
  }

  console.log('\n🎉 全部下載任務完成！');
}

main().catch(console.error);
