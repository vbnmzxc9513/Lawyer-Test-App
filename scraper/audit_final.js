/**
 * 終極驗收審計 - 以 *_complete.json 為真實資料來源
 * 直接從本地資料列出所有 Firestore 文件 ID，逐一檢查
 * 不依賴假設的 ID 範圍，杜絕 ID 格式錯誤
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

async function checkDoc(id) {
  try {
    const doc = await db.collection('questions').doc(id).get();
    if (!doc.exists) return { status: 'NOT_IN_FIRESTORE' };
    const d = doc.data();
    const exp = d.explanation;
    if (!exp) return { status: 'NO_EXP', hasQ: !!d.questionText };
    if (typeof exp === 'string') return { status: 'STRING_EXP', preview: exp.substring(0, 60) };
    if (typeof exp === 'object') {
      const hasCore = !!(exp.coreConcept && exp.coreConcept.length > 5);
      const hasAnalogy = !!(exp.analogy && exp.analogy.length > 10);
      const hasExplanation = !!(exp.coreExplanation && exp.coreExplanation.length > 10);
      const hasOptions = !!(exp.optionAnalysis && Object.keys(exp.optionAnalysis).length >= 2);
      const hasTakeaway = !!(exp.keyTakeaway && exp.keyTakeaway.length > 5);
      
      // Quality check
      const isGeneric = exp.coreConcept && exp.coreConcept.includes('本題考點涉及');
      const isTemplated = exp.analogy && exp.analogy.includes('本題測驗');
      
      if (!hasCore || !hasAnalogy) return { status: 'INCOMPLETE', fields: { hasCore, hasAnalogy, hasExplanation, hasOptions, hasTakeaway } };
      if (isGeneric && isTemplated) return { status: 'LOW_QUALITY', preview: exp.coreConcept.substring(0, 50) };
      return { status: 'GOOD', quality: (hasCore && hasAnalogy && hasExplanation && hasOptions && hasTakeaway) ? 'FULL' : 'PARTIAL' };
    }
    return { status: 'UNKNOWN_TYPE' };
  } catch(e) { return { status: 'ERROR', msg: e.message.substring(0, 50) }; }
}

async function run() {
  const years = ['111', '112', '113'];
  const summary = { total: 0, good: 0, lowQuality: 0, incomplete: 0, noExp: 0, notFound: 0, stringExp: 0, errors: [] };
  const lowQualityIds = [];
  const incompleteIds = [];
  const noExpIds = [];
  const notFoundIds = [];

  for (const yr of years) {
    const data = JSON.parse(fs.readFileSync(`data/${yr}_complete.json`));
    console.log(`\n========== ${yr}年 (${data.length} 題) ==========`);
    
    // Group by subject
    const bySubject = {};
    data.forEach(q => {
      const parts = q.id.split('-');
      const key = parts[1] + '-' + parts.slice(2, -1).join('-');
      if (!bySubject[key]) bySubject[key] = [];
      bySubject[key].push(q.id);
    });

    for (const [subj, ids] of Object.entries(bySubject)) {
      let good = 0, low = 0, inc = 0, noE = 0, nf = 0, str = 0;
      for (const id of ids) {
        summary.total++;
        const r = await checkDoc(id);
        switch(r.status) {
          case 'GOOD': good++; summary.good++; break;
          case 'LOW_QUALITY': low++; summary.lowQuality++; lowQualityIds.push(id); break;
          case 'INCOMPLETE': inc++; summary.incomplete++; incompleteIds.push(id); break;
          case 'NO_EXP': noE++; summary.noExp++; noExpIds.push(id); break;
          case 'NOT_IN_FIRESTORE': nf++; summary.notFound++; notFoundIds.push(id); break;
          case 'STRING_EXP': str++; summary.stringExp++; lowQualityIds.push(id); break;
          default: summary.errors.push({ id, status: r.status }); break;
        }
        await new Promise(r => setTimeout(r, 30));
      }
      const total = ids.length;
      const pct = Math.round(good / total * 100);
      const icon = (good === total) ? '✅' : (low + inc > 0 && noE + nf === 0) ? '⚠️' : '❌';
      let detail = '';
      if (low > 0) detail += ` low:${low}`;
      if (inc > 0) detail += ` inc:${inc}`;
      if (noE > 0) detail += ` noExp:${noE}`;
      if (nf > 0) detail += ` notFound:${nf}`;
      if (str > 0) detail += ` strExp:${str}`;
      console.log(`${icon} ${subj}: ${good}/${total} good (${pct}%)${detail}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`🏁 終極驗收結果`);
  console.log(`${'='.repeat(50)}`);
  console.log(`總題數: ${summary.total}`);
  console.log(`✅ 高品質詳解: ${summary.good}`);
  console.log(`⚠️  低品質(模板): ${summary.lowQuality}`);
  console.log(`⚠️  不完整: ${summary.incomplete}`);
  console.log(`❌ 無詳解: ${summary.noExp}`);
  console.log(`❌ Firestore不存在: ${summary.notFound}`);
  console.log(`❌ 字串格式: ${summary.stringExp}`);
  console.log(`覆蓋率: ${Math.round((summary.good + summary.lowQuality) / summary.total * 100)}%`);
  
  if (lowQualityIds.length > 0) {
    console.log(`\n--- 低品質題目 (${lowQualityIds.length}) ---`);
    lowQualityIds.forEach(id => console.log('  ' + id));
  }
  if (incompleteIds.length > 0) {
    console.log(`\n--- 不完整題目 (${incompleteIds.length}) ---`);
    incompleteIds.forEach(id => console.log('  ' + id));
  }
  if (noExpIds.length > 0) {
    console.log(`\n--- 無詳解題目 (${noExpIds.length}) ---`);
    noExpIds.forEach(id => console.log('  ' + id));
  }
  if (notFoundIds.length > 0) {
    console.log(`\n--- Firestore不存在 (${notFoundIds.length}) ---`);
    notFoundIds.forEach(id => console.log('  ' + id));
  }

  // Save report
  const report = { summary, lowQualityIds, incompleteIds, noExpIds, notFoundIds };
  fs.writeFileSync('final_audit_report.json', JSON.stringify(report, null, 2));
  console.log('\nReport saved to final_audit_report.json');
  process.exit();
}
run();
