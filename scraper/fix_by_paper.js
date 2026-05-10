/**
 * fix_by_paper.js - 按試卷逐份修正 Firestore 答案
 * 每次只讀取一份試卷的資料（避免配額超限）
 * 
 * 用法:
 *   node fix_by_paper.js --paper 111-0201 --dry-run
 *   node fix_by_paper.js --paper 111-0201 --confirm
 *   node fix_by_paper.js --all --dry-run
 *   node fix_by_paper.js --all --confirm
 */
const pdfParse = require('pdf-parse');
const fs = require('fs');
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const isDryRun = !process.argv.includes('--confirm');
const doAll = process.argv.includes('--all');
const paperArg = process.argv.includes('--paper')
  ? process.argv[process.argv.indexOf('--paper') + 1]
  : null;

const CONFIG = {
  '111-0101': { file:'PastExam/111/考畢題答/111120_ANS0101_綜合法學(一)(憲法).pdf', total:75, fsCode:'2301' },
  '111-0201': { file:'PastExam/111/考畢題答/111120_ANS0201_綜合法學(二)(民法.pdf',  total:80, fsCode:'3301' },
  '111-0202': { file:'PastExam/111/考畢題答/111120_ANS0202_綜合法學(二)(公司.pdf',  total:70, fsCode:'4301' },
  '111-0301': { file:'PastExam/111/考畢題答/111120_ANS0301_綜合法學(一)(刑法.pdf',  total:75, fsCode:'1301' },
  '112-0101': { file:'PastExam/112/考畢題答/112120_ANS0101_綜合法學(一)(憲法.pdf',  total:75, fsCode:'2301' },
  '112-0201': { file:'PastExam/112/考畢題答/112120_ANS0201_綜合法學(二)(民法.pdf',  total:80, fsCode:'3301' },
  '112-0202': { file:'PastExam/112/考畢題答/112120_ANS0202_綜合法學(二)(公司.pdf',  total:70, fsCode:'4301' },
  '112-0301': { file:'PastExam/112/考畢題答/112120_ANS0301_綜合法學(一)(刑法.pdf',  total:75, fsCode:'1301' },
  '113-0101': { file:'PastExam/113/考畢題答/113110_ANS0101_綜合法學(一)(憲法.pdf',  total:75, fsCode:'2301' },
  '113-0201': { file:'PastExam/113/考畢題答/113110_ANS0201_綜合法學(二)(民法.pdf',  total:80, fsCode:'3301' },
  '113-0202': { file:'PastExam/113/考畢題答/113110_ANS0202_綜合法學(二)(公司.pdf',  total:70, fsCode:'4301' },
  '113-0301': { file:'PastExam/113/考畢題答/113110_ANS0301_綜合法學(一)(刑法.pdf',  total:75, fsCode:'1301' },
};

async function parsePdf(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  const { text } = await pdfParse(buf);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  let q1 = null;
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i] === '第1題' && /^[A-D]$/.test(lines[i + 1])) { q1 = lines[i + 1]; break; }
  }
  const blocks = []; let inZone = false;
  for (const line of lines) {
    if (/^[A-D#]{2,}$/.test(line)) { blocks.push(line); inZone = true; }
    else if (/^[A-D#]$/.test(line) && (inZone || blocks.length > 0)) blocks.push(line);
    else if (inZone && line.includes('複選')) break;
  }
  const seq = (q1 || '') + blocks.join('');
  const ans = {};
  for (let i = 0; i < seq.length; i++) if (seq[i] !== '#') ans[i + 1] = seq[i];
  return ans;
}

async function processPaper(paperKey) {
  const cfg = CONFIG[paperKey];
  const [yearStr, pdfCode] = paperKey.split('-');
  const year = parseInt(yearStr);

  console.log(`\n📄 ${paperKey} (→ Firestore ${year}-${cfg.fsCode})`);

  // 解析 PDF
  const pdfAns = await parsePdf(cfg.file);
  const parsed = Object.keys(pdfAns).length;
  console.log(`   PDF解析: ${parsed}/${cfg.total}題, Q1=${pdfAns[1]} Q2=${pdfAns[2]} Q3=${pdfAns[3]}`);

  // 讀取此試卷的 Firestore 資料（只讀這份，避免配額問題）
  const snap = await db.collection('questions')
    .where('year', '==', year)
    .get();

  const toFix = [];
  snap.forEach(doc => {
    if (!doc.id.includes(`-${cfg.fsCode}-`)) return;
    const d = doc.data();
    const qNum = d.questionNumber || parseInt(doc.id.split('-').pop());
    if (!qNum || !d.answer) return;

    const pdfAnswer = pdfAns[qNum];
    if (!pdfAnswer) return;

    if (d.answer.toUpperCase() !== pdfAnswer.toUpperCase()) {
      toFix.push({ id: doc.id, qNum, oldAnswer: d.answer, newAnswer: pdfAnswer });
    }
  });

  if (toFix.length === 0) {
    console.log(`   ✅ 全部正確，無需修正`);
    return { paper: paperKey, fixed: 0 };
  }

  console.log(`   ❌ 發現 ${toFix.length} 題差異:`);
  toFix.sort((a, b) => a.qNum - b.qNum).forEach(f => {
    console.log(`      Q${String(f.qNum).padStart(2, '0')} [${f.id}]: ${f.oldAnswer} → ${f.newAnswer}`);
  });

  if (isDryRun) {
    console.log(`   ⚠️  DRY RUN，未修改`);
    return { paper: paperKey, fixed: 0, toFix: toFix.length };
  }

  // Batch write
  const batch = db.batch();
  toFix.forEach(f => {
    batch.update(db.collection('questions').doc(f.id), { answer: f.newAnswer });
  });
  await batch.commit();
  console.log(`   ✅ 已修正 ${toFix.length} 題`);

  // 記錄log
  const logEntry = { paper: paperKey, at: new Date().toISOString(), fixes: toFix };
  const logFile = 'fix_log.json';
  const log = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile)) : [];
  log.push(logEntry);
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));

  return { paper: paperKey, fixed: toFix.length };
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(isDryRun ? '🔍 DRY RUN 模式' : '⚡ EXECUTE 模式 - 修改 Firestore');
  console.log('═'.repeat(60));

  if (!isDryRun) {
    console.log('⚠️  5秒後開始執行（Ctrl+C 取消）');
    await new Promise(r => setTimeout(r, 5000));
  }

  const papers = doAll ? Object.keys(CONFIG) : (paperArg ? [paperArg] : []);

  if (papers.length === 0) {
    console.log('\n用法:');
    console.log('  node fix_by_paper.js --paper 111-0201 --dry-run');
    console.log('  node fix_by_paper.js --all --dry-run');
    console.log('  node fix_by_paper.js --paper 111-0201 --confirm');
    process.exit(0);
  }

  const results = [];
  for (const p of papers) {
    if (!CONFIG[p]) { console.log(`❌ 未知試卷: ${p}`); continue; }
    try {
      const r = await processPaper(p);
      results.push(r);
      // 每份試卷之間等300ms避免配額問題
      if (papers.indexOf(p) < papers.length - 1) await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      if (e.message.includes('Quota')) {
        console.log(`⏳ ${p} 配額超限，等待5秒後重試...`);
        await new Promise(r => setTimeout(r, 5000));
        try { results.push(await processPaper(p)); } catch(e2) { console.log(`❌ ${p} 失敗: ${e2.message}`); }
      } else {
        console.log(`❌ ${p} 錯誤: ${e.message}`);
      }
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 執行結果摘要:');
  results.forEach(r => console.log(`  ${r.paper}: ${r.fixed ?? r.toFix ?? 0} 題`));
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
