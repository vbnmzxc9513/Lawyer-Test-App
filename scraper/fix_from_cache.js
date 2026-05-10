/**
 * fix_from_cache.js - 從已知資料（不需讀取 Firestore）直接修正
 * 
 * 策略：使用 pdf_answers_cache.json（本地PDF解析結果）+ 之前讀取
 * 到的 verify_official_report.json（含所有文件ID）
 * 只做 WRITE，不做 READ，完全不受 quota 影響
 * 
 * 用法：
 *   node fix_from_cache.js --dry-run
 *   node fix_from_cache.js --confirm
 *   node fix_from_cache.js --paper 111-0201 --confirm
 */
const fs = require('fs');
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const isDryRun = !process.argv.includes('--confirm');
const paperFilter = process.argv.includes('--paper')
  ? process.argv[process.argv.indexOf('--paper') + 1]
  : null;

// 讀取之前快取的資料
const pdfCache = JSON.parse(fs.readFileSync('pdf_answers_cache.json'));
const report   = JSON.parse(fs.readFileSync('verify_official_report.json'));

// 從 report 中建立 documentId → 當前 Firestore 答案 的索引
// report.mismatches 有 { id, firestoreAnswer } 欄位
const reportIdx = {};
report.mismatches.forEach(m => { reportIdx[m.id] = m; });

// 建立試卷對應
const FS_CODE  = { '0101':'2301', '0201':'3301', '0202':'4301', '0301':'1301' };
const TOTAL_Q  = { '0101':75, '0201':80, '0202':70, '0301':75 };
const SUBJECT_RANGES = {
  '2301': { constitutional:[1,20], administrative:[21,55], international_public:[56,65], international_private:[66,75] },
  '3301': { civil:[1,50], civil_procedure:[51,80] },
  '4301': { company:[1,15], insurance:[16,25], negotiable_instruments:[26,35], securities:[36,50], enforcement:[46,60], legal_english:[56,70] },
  '1301': { criminal:[1,50], criminal_procedure:[51,65], legal_ethics:[61,75] },
};

function getSubject(fsCode, qNum) {
  const ranges = SUBJECT_RANGES[fsCode];
  if (!ranges) return null;
  for (const [subj, [lo, hi]] of Object.entries(ranges)) {
    if (qNum >= lo && qNum <= hi) return subj;
  }
  return null;
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(isDryRun ? '🔍 DRY RUN (不寫入 Firestore)' : '⚡ EXECUTE - 僅做 WRITE，不讀 Firestore');
  if (paperFilter) console.log(`📌 只處理: ${paperFilter}`);
  console.log('═'.repeat(60));

  const toFix = []; // { docId, oldAns, newAns, paper, qNum }

  for (const [paperKey, pdfInfo] of Object.entries(pdfCache)) {
    if (paperFilter && paperKey !== paperFilter) continue;

    const [yearStr, pdfCode] = paperKey.split('-');
    const year = parseInt(yearStr);
    const fsCode = FS_CODE[pdfCode];
    const total = TOTAL_Q[pdfCode];
    const pdfAns = pdfInfo.answers;

    let paperDiffs = 0;

    for (let q = 1; q <= total; q++) {
      const pdfAnswer = pdfAns[q];
      if (!pdfAnswer) continue;

      // 嘗試構造文件ID（多種格式）
      // 格式1: year-fsCode-subject-qNum (最常見)
      const subject = getSubject(fsCode, q);
      const candidates = [];
      if (subject) candidates.push(`${year}-${fsCode}-${subject}-${q}`);
      candidates.push(`${year}-${fsCode}-${q}`);

      // 從 report.mismatches 找到這題的文件ID
      const mismatch = report.mismatches.find(m =>
        m.year === year && m.pdfCode === pdfCode && m.qNum === q
      );

      if (mismatch) {
        // 確認：report 說 Firestore 答案 !== PDF 答案嗎?
        if (mismatch.firestoreAnswer.toUpperCase() !== pdfAnswer.toUpperCase()) {
          toFix.push({
            docId: mismatch.id,
            oldAns: mismatch.firestoreAnswer,
            newAns: pdfAnswer,
            paper: paperKey,
            qNum: q,
            subject: mismatch.subject,
          });
          paperDiffs++;
        }
      }
      // 若 report 沒有記錄，代表這題在之前比對時是「相符」的，不需修改
    }

    if (paperDiffs > 0) {
      console.log(`\n【${paperKey}】 ${paperDiffs} 題需修正`);
    } else {
      console.log(`✅ ${paperKey}: 無差異`);
    }
  }

  // 顯示所有修正明細
  const byPaper = {};
  toFix.forEach(f => { (byPaper[f.paper]=byPaper[f.paper]||[]).push(f); });

  for (const [paper, items] of Object.entries(byPaper).sort()) {
    console.log(`\n【${paper}】 共${items.length}題:`);
    items.sort((a,b)=>a.qNum-b.qNum).forEach(f =>
      console.log(`  Q${String(f.qNum).padStart(2,'0')} [${f.docId}]: ${f.oldAns} → ${f.newAns}`)
    );
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 總計: ${toFix.length} 題需修正`);

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN，未寫入。確認後執行:');
    console.log('   node fix_from_cache.js --confirm');
    process.exit(0);
  }

  // ── 執行寫入（只做 WRITE，不讀 Firestore）──
  console.log('\n⚠️  5秒後開始寫入 Firestore (Ctrl+C 取消)');
  await new Promise(r => setTimeout(r, 5000));

  // 分批 batch write（每批 400 筆）
  let count = 0;
  let batch = db.batch();
  let batchSize = 0;

  for (const f of toFix) {
    batch.update(db.collection('questions').doc(f.docId), { answer: f.newAns });
    batchSize++; count++;
    if (batchSize >= 400) {
      await batch.commit();
      console.log(`  ✅ 已提交 ${count}/${toFix.length} 題...`);
      batch = db.batch();
      batchSize = 0;
    }
  }
  if (batchSize > 0) await batch.commit();

  console.log(`\n🎉 完成！共修正 ${count} 題`);

  // 寫入 log
  const logEntry = { at: new Date().toISOString(), totalFixed: count, fixes: toFix };
  const logPath = 'fix_log.json';
  const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath)) : [];
  log.push(logEntry);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.log('📄 log 已儲存: fix_log.json');

  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
