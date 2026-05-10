/**
 * verify_official.js
 * 用官方網站讀取的標準答案（111~113年，共12份試卷）與 Firestore 比對
 * 
 * SOP：
 *  1. 只讀取，不修改任何資料
 *  2. 輸出 diff 報告 + fix_official.js 腳本
 *  3. 使用者確認後才手動執行 fix_official.js
 */
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

// ─── 官方標準答案（從考選部官網讀取，2026-05-10）───
// Firestore 代碼對應: 0101→2301, 0201→3301, 0202→4301, 0301→1301
const OFFICIAL = {
  // 113年
  '113-2301': 'DADDDDDDDA DBCADAABCB ADCCAABDDBA DCADCDDBD BADDDDBDDC BBDABDCCBB AABDDDBC AA BCCCAABCA',
  '113-3301': 'DCCBCBCCCB BBCACADBCC BBDDAABBCA DCACCADCAA DBBDDBBCAC BDDCBDCBDA CBBCADBCBA AABCCADCBB BB',
  '113-4301': 'BCDADBBCDB BCDDADBDCD BADAACDDD BDDBCACD DACBBBDCA CDDACCBDAA CABCCAAB ADDDDDBCBB CB ADDDDAADBC',
  '113-1301': 'AADBCADBBA ACBCCCDCAB DDDABCBCCC ABDC BDCBDB BCCCADABCD BCCBBC CCDBDDBAB CDA ADBC BACBA BCDDA',

  // 112年
  '112-2301': 'AADADBCDCB BCDDDBD CBD DDDADD BCDB DDCD DDB BCABD BDDCBD AACBBB CBD DCD AADCBBB',
  '112-3301': 'ABDCDBACBC BCACAABCBC BBDCDCBA BD DCBACABC DADBCBA BDADABCA BBBADAAD CBDCBCAC DBBBDCAB DC BA DCBC',
  '112-4301': 'CDACDAACD BDDBADBD ABDBDDDAD CA DDDDCCDDB CDAADB BABB CBDCCB DBDC CBBA BBAB DBDC',
  '112-1301': 'DBDBCDDBB ADCBCAADCC DBDAAADCB ABCBBBCCDD CCBDDCDDBC CCDDCBCBCB BABBBBDB CBCBBBBC BA CAABCB',

  // 111年
  '111-2301': 'BCCADCDDCB BDABDDCCC ADDBCDCDCB CABDCCCDB DDBACDCABB BDBCACBCBC CBCBBABCAD BABBC BD',
  '111-3301': 'ADCACDBBCB DBDADDDDB AACBCDADBC BDDADCBAD BABBBBABAB CDCBABDDCC DCBDCADDBD DCCDBBDDAD DD',
  '111-4301': 'CACDCBAACA BDCCCBDCD AACBABBBDC DACBDAACA BABDCDCBCB CBADDADBDB ADCBCBDDAB DD',
  '111-1301': 'DDBAABACAA ABBDBCDAA DCBACABABD CBAACBDDC DBDCCDADDA DCDABDADAD CBCDBDCABD DDADC DC',
};

// 解析答案字串為 {1:'A', 2:'B', ...}
function parseAnswerStr(str, total) {
  const letters = str.replace(/[^A-D]/g, '');
  const ans = {};
  for (let i = 0; i < Math.min(letters.length, total); i++) {
    ans[i + 1] = letters[i];
  }
  return ans;
}

// 精確的官方答案（從 browser subagent 讀取）
const OFFICIAL_EXACT = {
  // 113年
  '113-2301': {1:'D',2:'A',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'A',11:'D',12:'B',13:'C',14:'A',15:'D',16:'A',17:'A',18:'A',19:'C',20:'B',21:'A',22:'D',23:'C',24:'C',25:'C',26:'A',27:'B',28:'D',29:'D',30:'D',31:'A',32:'C',33:'A',34:'D',35:'C',36:'D',37:'D',38:'B',39:'D',40:'B',41:'A',42:'C',43:'C',44:'B',45:'C',46:'A',47:'A',48:'D',49:'D',50:'B',51:'D',52:'D',53:'D',54:'B',55:'B',56:'A',57:'B',58:'D',59:'C',60:'C',61:'C',62:'B',63:'B',64:'A',65:'A',66:'B',67:'C',68:'D',69:'D',70:'C',71:'A',72:'B',73:'C',74:'C',75:'A'},
  '113-3301': {1:'D',2:'C',3:'C',4:'B',5:'C',6:'B',7:'C',8:'C',9:'C',10:'B',11:'B',12:'B',13:'C',14:'A',15:'C',16:'A',17:'D',18:'B',19:'C',20:'C',21:'B',22:'B',23:'D',24:'D',25:'A',26:'A',27:'B',28:'B',29:'B',30:'C',31:'A',32:'C',33:'A',34:'C',35:'C',36:'D',37:'A',38:'C',39:'C',40:'B',41:'D',42:'B',43:'C',44:'A',45:'B',46:'B',47:'B',48:'D',49:'D',50:'A',51:'C',52:'B',53:'A',54:'D',55:'C',56:'C',57:'D',58:'C',59:'B',60:'D',61:'A',62:'C',63:'A',64:'D',65:'D',66:'D',67:'B',68:'C',69:'B',70:'B',71:'A',72:'A',73:'B',74:'C',75:'C',76:'A',77:'D',78:'C',79:'B',80:'B'},
  '113-4301': {1:'B',2:'C',3:'D',4:'A',5:'D',6:'B',7:'C',8:'D',9:'D',10:'B',11:'B',12:'C',13:'D',14:'D',15:'A',16:'D',17:'B',18:'D',19:'C',20:'D',21:'B',22:'A',23:'A',24:'C',25:'A',26:'D',27:'D',28:'B',29:'D',30:'D',31:'A',32:'C',33:'D',34:'D',35:'C',36:'C',37:'D',38:'C',39:'A',40:'C',41:'B',42:'C',43:'C',44:'B',45:'A',46:'C',47:'C',48:'A',49:'B',50:'A',51:'D',52:'C',53:'B',54:'D',55:'D',56:'C',57:'C',58:'D',59:'B',60:'B',61:'A',62:'D',63:'D',64:'D',65:'D',66:'B',67:'C',68:'B',69:'B',70:'C'},
  '113-1301': {1:'A',2:'A',3:'D',4:'B',5:'C',6:'A',7:'D',8:'B',9:'B',10:'A',11:'A',12:'C',13:'B',14:'C',15:'C',16:'C',17:'D',18:'C',19:'A',20:'B',21:'D',22:'D',23:'D',24:'A',25:'B',26:'C',27:'B',28:'C',29:'C',30:'C',31:'A',32:'B',33:'D',34:'C',35:'B',36:'D',37:'A',38:'A',39:'C',40:'D',41:'B',42:'C',43:'A',44:'C',45:'D',46:'B',47:'C',48:'B',49:'B',50:'C',51:'B',52:'A',53:'A',54:'B',55:'C',56:'C',57:'D',58:'B',59:'D',60:'B',61:'C',62:'B',63:'C',64:'D',65:'D',66:'D',67:'B',68:'A',69:'B',70:'C',71:'A',72:'A',73:'B',74:'C',75:'A'},
  // 112年
  '112-2301': {1:'A',2:'A',3:'D',4:'A',5:'D',6:'B',7:'C',8:'D',9:'C',10:'B',11:'B',12:'C',13:'D',14:'D',15:'D',16:'B',17:'D',18:'C',19:'B',20:'B',21:'D',22:'D',23:'D',24:'A',25:'D',26:'D',27:'B',28:'C',29:'B',30:'A',31:'D',32:'C',33:'D',34:'C',35:'B',36:'D',37:'D',38:'C',39:'D',40:'C',41:'D',42:'D',43:'B',44:'C',45:'B',46:'C',47:'B',48:'C',49:'A',50:'B',51:'D',52:'D',53:'D',54:'C',55:'B',56:'B',57:'A',58:'B',59:'C',60:'C',61:'A',62:'C',63:'C',64:'D',65:'A',66:'A',67:'A',68:'D',69:'C',70:'B',71:'B',72:'C',73:'C',74:'B',75:'B'},
  '112-3301': {1:'A',2:'B',3:'D',4:'C',5:'D',6:'B',7:'A',8:'C',9:'B',10:'C',11:'B',12:'C',13:'C',14:'A',15:'C',16:'A',17:'A',18:'C',19:'B',20:'C',21:'B',22:'B',23:'D',24:'C',25:'D',26:'C',27:'B',28:'A',29:'B',30:'B',31:'C',32:'D',33:'A',34:'B',35:'C',36:'A',37:'C',38:'A',39:'B',40:'C',41:'D',42:'B',43:'D',44:'A',45:'C',46:'B',47:'B',48:'A',49:'D',50:'C',51:'D',52:'D',53:'A',54:'D',55:'B',56:'D',57:'C',58:'A',59:'C',60:'D',61:'C',62:'D',63:'B',64:'C',65:'B',66:'C',67:'B',68:'D',69:'D',70:'C',71:'B',72:'C',73:'A',74:'B',75:'A',76:'A',77:'D',78:'C',79:'B',80:'C'},
  '112-4301': {1:'C',2:'D',3:'A',4:'C',5:'D',6:'A',7:'A',8:'C',9:'D',10:'B',11:'D',12:'B',13:'B',14:'D',15:'A',16:'D',17:'B',18:'A',19:'C',20:'B',21:'D',22:'D',23:'D',24:'A',25:'D',26:'D',27:'D',28:'D',29:'C',30:'C',31:'D',32:'D',33:'A',34:'D',35:'B',36:'C',37:'D',38:'A',39:'A',40:'B',41:'B',42:'A',43:'B',44:'C',45:'B',46:'D',47:'D',48:'C',49:'C',50:'D',51:'C',52:'B',53:'B',54:'B',55:'A',56:'B',57:'D',58:'B',59:'D',60:'C',61:'B',62:'B',63:'A',64:'B',65:'D',66:'D',67:'D',68:'B',69:'C',70:'C'},
  '112-1301': {1:'D',2:'B',3:'D',4:'B',5:'C',6:'D',7:'D',8:'B',9:'B',10:'A',11:'D',12:'C',13:'B',14:'C',15:'A',16:'A',17:'D',18:'C',19:'C',20:'D',21:'B',22:'D',23:'D',24:'A',25:'A',26:'A',27:'A',28:'C',29:'C',30:'A',31:'C',32:'B',33:'B',34:'B',35:'B',36:'C',37:'C',38:'D',39:'D',40:'C',41:'C',42:'B',43:'D',44:'D',45:'C',46:'B',47:'B',48:'D',49:'B',50:'B',51:'B',52:'B',53:'B',54:'C',55:'B',56:'B',57:'A',58:'C',59:'C',60:'A',61:'C',62:'C',63:'D',64:'A',65:'C',66:'A',67:'A',68:'B',69:'C',70:'C',71:'B',72:'B',73:'B',74:'C',75:'B'},
  // 111年
  '111-2301': {1:'B',2:'C',3:'C',4:'A',5:'D',6:'C',7:'D',8:'D',9:'C',10:'B',11:'B',12:'B',13:'D',14:'A',15:'B',16:'D',17:'D',18:'C',19:'C',20:'C',21:'A',22:'D',23:'D',24:'B',25:'C',26:'D',27:'C',28:'D',29:'C',30:'B',31:'C',32:'A',33:'D',34:'B',35:'D',36:'C',37:'C',38:'C',39:'D',40:'B',41:'D',42:'D',43:'B',44:'A',45:'D',46:'C',47:'C',48:'A',49:'B',50:'AB',51:'B',52:'D',53:'B',54:'C',55:'A',56:'C',57:'B',58:'C',59:'B',60:'C',61:'C',62:'B',63:'C',64:'B',65:'B',66:'A',67:'B',68:'C',69:'A',70:'D',71:'B',72:'A',73:'B',74:'B',75:'C'},
  '111-3301': {1:'A',2:'D',3:'C',4:'A',5:'C',6:'D',7:'B',8:'B',9:'C',10:'B',11:'D',12:'D',13:'B',14:'D',15:'A',16:'D',17:'D',18:'D',19:'D',20:'B',21:'A',22:'A',23:'C',24:'C',25:'A',26:'D',27:'D',28:'B',29:'B',30:'C',31:'B',32:'D',33:'D',34:'D',35:'A',36:'D',37:'C',38:'B',39:'A',40:'D',41:'B',42:'A',43:'B',44:'B',45:'B',46:'B',47:'A',48:'B',49:'A',50:'B',51:'C',52:'D',53:'C',54:'B',55:'A',56:'B',57:'D',58:'D',59:'C',60:'C',61:'D',62:'C',63:'B',64:'D',65:'C',66:'A',67:'D',68:'B',69:'B',70:'D',71:'D',72:'C',73:'C',74:'D',75:'D',76:'B',77:'B',78:'D',79:'A',80:'D'},
  '111-4301': {1:'C',2:'A',3:'C',4:'D',5:'B',6:'A',7:'A',8:'C',9:'A',10:'A',11:'B',12:'D',13:'D',14:'C',15:'C',16:'C',17:'B',18:'D',19:'C',20:'D',21:'A',22:'A',23:'C',24:'B',25:'B',26:'B',27:'B',28:'D',29:'D',30:'C',31:'D',32:'A',33:'D',34:'C',35:'B',36:'D',37:'A',38:'A',39:'C',40:'A',41:'B',42:'A',43:'B',44:'D',45:'D',46:'C',47:'C',48:'B',49:'C',50:'B',51:'C',52:'B',53:'A',54:'D',55:'D',56:'A',57:'D',58:'B',59:'D',60:'B',61:'A',62:'D',63:'C',64:'B',65:'C',66:'B',67:'D',68:'D',69:'A',70:'B'},
  '111-1301': {1:'D',2:'D',3:'B',4:'A',5:'B',6:'B',7:'A',8:'C',9:'A',10:'A',11:'A',12:'D',13:'B',14:'B',15:'D',16:'B',17:'C',18:'D',19:'A',20:'A',21:'D',22:'C',23:'B',24:'C',25:'A',26:'B',27:'A',28:'B',29:'B',30:'D',31:'C',32:'B',33:'C',34:'A',35:'A',36:'C',37:'B',38:'D',39:'D',40:'C',41:'D',42:'B',43:'D',44:'C',45:'C',46:'D',47:'A',48:'D',49:'D',50:'A',51:'D',52:'C',53:'D',54:'A',55:'B',56:'D',57:'A',58:'D',59:'A',60:'D',61:'C',62:'B',63:'C',64:'D',65:'D',66:'D',67:'C',68:'A',69:'B',70:'D',71:'D',72:'D',73:'A',74:'D',75:'C'},
};

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  官方答案驗證（考選部官網資料）安全比對工具      ║');
  console.log('║  【唯讀模式】不修改任何 Firestore 資料           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  console.log('📡 讀取 Firestore 所有題目...');
  const snap = await db.collection('questions').get();
  console.log(`✅ 共 ${snap.size} 題\n`);

  // 建立 Firestore 索引
  const fsIdx = {};
  snap.forEach(doc => {
    const d = doc.data();
    const parts = doc.id.split('-');
    const year = parseInt(parts[0]);
    const fsCode = parts[1];
    const qNum = d.questionNumber || parseInt(parts[parts.length - 1]);
    if (year && fsCode && qNum) {
      const key = `${year}-${fsCode}-${qNum}`;
      fsIdx[key] = { id: doc.id, answer: d.answer, subject: d.subject, questionText: (d.questionText||'').substring(0,60) };
    }
  });

  const mismatches = [];
  const matched = [];
  const notInFS = [];
  const noAnswerInFS = [];

  // 比對每份試卷
  for (const [paperKey, officialAns] of Object.entries(OFFICIAL_EXACT)) {
    const [year, fsCode] = paperKey.split('-');
    const pdfCodeMap = {'2301':'0101','3301':'0201','4301':'0202','1301':'0301'};
    const pdfCode = pdfCodeMap[fsCode];
    const totalQ = Object.keys(officialAns).length;

    process.stdout.write(`📄 ${year}年-${pdfCode}(${fsCode}) ${totalQ}題... `);
    let paperMatch=0, paperMismatch=0, paperNotFound=0;

    for (const [qNumStr, offAns] of Object.entries(officialAns)) {
      const qNum = parseInt(qNumStr);
      const key = `${year}-${fsCode}-${qNum}`;
      const fsDoc = fsIdx[key];

      if (!fsDoc) {
        notInFS.push({ year, pdfCode, fsCode, qNum, officialAnswer: offAns });
        paperNotFound++;
        continue;
      }
      if (!fsDoc.answer) {
        noAnswerInFS.push({ id: fsDoc.id, qNum, officialAnswer: offAns });
        continue;
      }

      // 111年Q50可接受A或B
      const fsAns = fsDoc.answer.toUpperCase();
      const isMatch = offAns === 'AB'
        ? (fsAns === 'A' || fsAns === 'B')
        : fsAns === offAns;

      if (isMatch) {
        matched.push(key);
        paperMatch++;
      } else {
        mismatches.push({
          id: fsDoc.id,
          year: parseInt(year), pdfCode, fsCode, qNum,
          subject: fsDoc.subject,
          firestoreAnswer: fsDoc.answer,
          officialAnswer: offAns,
          questionText: fsDoc.questionText,
        });
        paperMismatch++;
      }
    }
    console.log(`✅${paperMatch} ❌${paperMismatch} 🔍${paperNotFound}`);
  }

  // ── 報告 ──
  console.log('\n' + '═'.repeat(55));
  console.log('📊 最終驗證結果（基於考選部官方答案）');
  console.log('═'.repeat(55));
  console.log(`✅ 答案正確: ${matched.length} 題`);
  console.log(`❌ 答案不符（需修正）: ${mismatches.length} 題`);
  console.log(`🔍 Firestore 無對應: ${notInFS.length} 題`);
  console.log(`⚠️  Firestore 無 answer 欄位: ${noAnswerInFS.length} 題`);

  if (mismatches.length > 0) {
    console.log('\n❌ 需修正的題目（按試卷分組）:');
    const grouped = {};
    mismatches.forEach(m => { const k=`${m.year}年-${m.pdfCode}`; (grouped[k]=grouped[k]||[]).push(m); });
    for (const [g, items] of Object.entries(grouped).sort()) {
      console.log(`\n【${g}】 ${items.length}題`);
      items.sort((a,b)=>a.qNum-b.qNum).forEach(m => {
        console.log(`  Q${String(m.qNum).padStart(2,'0')} [${m.id}]`);
        console.log(`    FS:${m.firestoreAnswer} → 官方:${m.officialAnswer}  (${m.subject})`);
        if (m.questionText) console.log(`    "${m.questionText}..."`);
      });
    }
  }

  if (notInFS.length > 0) {
    console.log('\n🔍 官方有答案但 Firestore 無對應題目（按試卷）:');
    const byPaper = {};
    notInFS.forEach(n => { const k=`${n.year}-${n.fsCode}`; (byPaper[k]=byPaper[k]||[]).push(n.qNum); });
    for (const [k,nums] of Object.entries(byPaper).sort()) {
      console.log(`  ${k}: ${nums.sort((a,b)=>a-b).join(', ')} (共${nums.length}題)`);
    }
  }

  // ── 儲存報告 ──
  const report = {
    generatedAt: new Date().toISOString(),
    source: '考選部官方網站 (moex.gov.tw)',
    summary: { matched: matched.length, mismatches: mismatches.length, notInFirestore: notInFS.length, noAnswerField: noAnswerInFS.length },
    mismatches,
    notInFirestore: notInFS,
  };
  require('fs').writeFileSync('verify_official_report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 報告已儲存: verify_official_report.json');

  // ── 生成修正腳本（含安全確認）──
  if (mismatches.length > 0) {
    const fixes = mismatches.map(m =>
      `  // Q${m.qNum} ${m.subject} FS:${m.firestoreAnswer}→官方:${m.officialAnswer}\n  { id:'${m.id}', ans:'${m.officialAnswer}' },`
    ).join('\n');

    const fixScript = `/**
 * fix_official.js - 根據考選部官方答案修正 Firestore
 * ⚠️  執行前請確認 verify_official_report.json 的內容
 * 生成於 ${new Date().toISOString()}
 * 共 ${mismatches.length} 題需修正
 */
const admin=require('firebase-admin');
admin.initializeApp({credential:admin.credential.cert(require('./serviceAccountKey.json'))});
const db=admin.firestore();

const fixes=[
${fixes}
];

async function run(){
  console.log('⚠️  即將修正', fixes.length, '題答案...');
  console.log('確定要繼續嗎？(Ctrl+C 取消，等待5秒後自動執行)');
  await new Promise(r => setTimeout(r, 5000));
  
  for(const f of fixes){
    await db.collection('questions').doc(f.id).update({answer:f.ans});
    console.log('✅', f.id, '→', f.ans);
  }
  console.log('\\n🎉 完成！共修正', fixes.length, '題');
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});`;

    require('fs').writeFileSync('fix_official.js', fixScript);
    console.log('🔧 修正腳本已生成: fix_official.js');
    console.log('   ⚠️  請先確認報告無誤，再執行 node fix_official.js');
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
