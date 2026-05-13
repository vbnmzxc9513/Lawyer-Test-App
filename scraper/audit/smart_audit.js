/**
 * smart_audit.js — 智慧型品質檢查
 * 
 * 理解兩種題型：
 * 1. 「找正確答案」— 正確選項標記✅/本題答案/正確答案
 * 2. 「找錯誤選項」— 答案選項標記「錯誤」(因為它是錯誤的敘述)，其他標記「正確」
 * 
 * 偵測邏輯：尋找包含「本題答案」或「答案X」的標記
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('../config/serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

const SUBJECT_TAG_MAP = {
  constitutional: ['憲法'],
  administrative: ['行政法'],
  international_public: ['國際公法', '國公'],
  international_private: ['國際私法', '國私'],
  criminal: ['刑法'],
  criminal_procedure: ['刑訴', '刑事訴訟'],
  legal_ethics: ['法倫', '法律倫理'],
  civil: ['民法'],
  civil_procedure: ['民訴', '民事訴訟'],
  company: ['公司法', '公司'],
  insurance: ['保險法', '保險'],
  negotiable_instruments: ['票據法', '票據'],
  securities: ['證交法', '證券', '證交'],
  enforcement: ['強制執行', '強執'],
  legal_english: ['法英', '法學英文']
};

/**
 * Smart detection: which option does the explanation claim is the answer?
 */
function smartDetectAnswer(oa, dbAnswer) {
  if (!oa) return { detected: null, confident: false };
  
  // Strategy 1: Look for explicit "本題答案" or "答案X" markers
  for (const opt of ['A', 'B', 'C', 'D']) {
    const t = oa[opt] || '';
    if (t.includes('本題答案') || t.includes('答案' + opt) || t.includes('(答案)') || t.includes('（答案）')) {
      return { detected: opt, confident: true, method: 'explicit_marker' };
    }
  }
  
  // Strategy 2: Look for "✅ 正確" on exactly one option (and that's marked as THE correct answer)
  const withCheckmark = [];
  for (const opt of ['A', 'B', 'C', 'D']) {
    const t = oa[opt] || '';
    if (t.includes('✅')) withCheckmark.push(opt);
  }
  if (withCheckmark.length === 1) {
    return { detected: withCheckmark[0], confident: true, method: 'single_checkmark' };
  }
  
  // Strategy 3: For "find the wrong statement" questions
  // Pattern: 3 options say "正確" (meaning statement is correct), 1 says "錯誤" (meaning statement is wrong = answer)
  // In this case, the one marked "錯誤" IS the answer
  const markedCorrect = [];
  const markedWrong = [];
  for (const opt of ['A', 'B', 'C', 'D']) {
    const t = oa[opt] || '';
    const startsCorrect = t.startsWith('正確') || t.startsWith('【正確】');
    const startsWrong = t.startsWith('錯誤') || t.startsWith('【錯誤');
    if (startsCorrect) markedCorrect.push(opt);
    if (startsWrong) markedWrong.push(opt);
  }
  if (markedWrong.length === 1 && markedCorrect.length >= 2) {
    // "Find the wrong one" format — the wrong one IS the answer
    return { detected: markedWrong[0], confident: true, method: 'find_wrong_format' };
  }
  if (markedCorrect.length === 1 && markedWrong.length >= 2) {
    // "Find the correct one" format
    return { detected: markedCorrect[0], confident: true, method: 'find_correct_format' };
  }
  
  return { detected: null, confident: false, method: 'unable_to_determine' };
}

async function run() {
  console.log('🔍 智慧型品質檢查...\n');
  
  const issues = { expMismatch: [], tagMismatch: [], noTag: [], uncertain: [] };
  let total = 0, checked = 0, matches = 0;
  
  for (const year of [111, 112, 113, 114]) {
    const snap = await db.collection('questions').where('year', '==', year).get();
    let yearMismatch = 0, yearMatch = 0, yearUncertain = 0;
    
    snap.forEach(doc => {
      total++;
      const d = doc.data();
      const exp = d.explanation;
      
      if (exp && exp.optionAnalysis) {
        checked++;
        const result = smartDetectAnswer(exp.optionAnalysis, d.answer);
        
        if (result.confident) {
          if (result.detected === d.answer) {
            matches++;
            yearMatch++;
          } else {
            yearMismatch++;
            issues.expMismatch.push({
              id: doc.id, dbAnswer: d.answer, detected: result.detected,
              method: result.method, subject: d.subject
            });
          }
        } else {
          yearUncertain++;
          issues.uncertain.push(doc.id);
        }
      }
      
      // Tag check
      const tag = d.tag || '';
      if (!tag.trim()) {
        issues.noTag.push(doc.id);
      } else {
        const expected = SUBJECT_TAG_MAP[d.subject] || [];
        const hasMatch = expected.some(p => tag.includes(p));
        if (!hasMatch && expected.length > 0) {
          issues.tagMismatch.push({ id: doc.id, subject: d.subject, tag: tag.substring(0, 60) });
        }
      }
    });
    
    console.log(`${year}年: 一致${yearMatch} 不一致${yearMismatch} 無法判定${yearUncertain}`);
  }
  
  console.log(`\n=== 真正的不一致 (${issues.expMismatch.length}) ===`);
  for (const m of issues.expMismatch) {
    console.log(`  ${m.id}: DB=${m.dbAnswer} detected=${m.detected} (${m.method})`);
  }
  
  console.log(`\n=== 無法自動判定 (${issues.uncertain.length}) ===`);
  if (issues.uncertain.length <= 30) {
    issues.uncertain.forEach(x => console.log(`  ${x}`));
  } else {
    console.log(`  共 ${issues.uncertain.length} 題，格式多樣無法自動解析`);
  }
  
  console.log(`\n=== Tag 不匹配 (${issues.tagMismatch.length}) ===`);
  issues.tagMismatch.slice(0, 20).forEach(x => console.log(`  ${x.id}: ${x.subject} → "${x.tag}"`));
  if (issues.tagMismatch.length > 20) console.log(`  ... 及其他 ${issues.tagMismatch.length - 20} 項`);
  
  console.log('\n=== 總結 ===');
  console.log(`  總題數: ${total}`);
  console.log(`  有optionAnalysis: ${checked}`);
  console.log(`  標記一致: ${matches}`);
  console.log(`  確定不一致: ${issues.expMismatch.length}`);
  console.log(`  無法判定: ${issues.uncertain.length}`);
  console.log(`  Tag不匹配: ${issues.tagMismatch.length}`);
  
  fs.writeFileSync(require('path').join(__dirname, '../reports/smart_audit_report.json'), JSON.stringify(issues, null, 2), 'utf-8');
  process.exit();
}

run();
