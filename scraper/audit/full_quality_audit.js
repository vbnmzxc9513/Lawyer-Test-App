/**
 * full_quality_audit.js — 全面品質檢查
 * 1. 答案 vs 官方
 * 2. 詳解 optionAnalysis 標記 vs 答案
 * 3. tag 檢查：是否存在、是否包含對應科目
 * 4. 詳解內容完整性：coreConcept, coreExplanation, optionAnalysis 都有
 * 5. 科目 vs doc.id 一致性
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('../config/serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

// Subject to expected tag prefix mapping
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

function detectExpAnswer(exp) {
  if (!exp || !exp.optionAnalysis) return null;
  const oa = exp.optionAnalysis;
  for (const opt of ['A', 'B', 'C', 'D']) {
    const text = (oa[opt] || '');
    const hasCorrect = text.includes('正確') || text.includes('✅');
    const hasWrong = text.includes('錯誤') || text.includes('不正確') || text.includes('❌') || text.includes('有誤');
    if (hasCorrect && !hasWrong) return opt;
  }
  return null;
}

async function run() {
  console.log('🔍 全面品質檢查...\n');
  
  const issues = { answerWrong: [], expMismatch: [], noExp: [], noTag: [], tagMismatch: [], incompleteExp: [], idMismatch: [] };
  let total = 0;
  
  for (const year of [111, 112, 113, 114]) {
    const snap = await db.collection('questions').where('year', '==', year).get();
    
    snap.forEach(doc => {
      total++;
      const d = doc.data();
      const parts = doc.id.split('-');
      const idSubject = parts[2];
      const idQnum = parseInt(parts[3]);
      
      // 1. ID vs data consistency
      if (d.subject !== idSubject) {
        issues.idMismatch.push({ id: doc.id, idSubject, dataSubject: d.subject });
      }
      if (d.questionNumber !== idQnum) {
        issues.idMismatch.push({ id: doc.id, idQnum, dataQnum: d.questionNumber });
      }
      
      // 2. Explanation completeness
      const exp = d.explanation;
      if (!exp || typeof exp !== 'object') {
        issues.noExp.push(doc.id);
      } else {
        if (!exp.coreConcept) issues.incompleteExp.push({ id: doc.id, missing: 'coreConcept' });
        if (!exp.coreExplanation) issues.incompleteExp.push({ id: doc.id, missing: 'coreExplanation' });
        if (!exp.optionAnalysis) issues.incompleteExp.push({ id: doc.id, missing: 'optionAnalysis' });
        
        // 3. Option marking consistency
        const expAns = detectExpAnswer(exp);
        if (expAns && expAns !== d.answer) {
          issues.expMismatch.push({ id: doc.id, dbAns: d.answer, expAns });
        }
      }
      
      // 4. Tag check
      const tag = d.tag;
      if (!tag || tag.trim() === '') {
        issues.noTag.push(doc.id);
      } else {
        // Check if tag contains relevant subject keywords
        const expectedPrefixes = SUBJECT_TAG_MAP[d.subject] || [];
        const tagLower = tag.toLowerCase();
        const hasRelevantTag = expectedPrefixes.some(p => tagLower.includes(p.toLowerCase()) || tag.includes(p));
        if (!hasRelevantTag && expectedPrefixes.length > 0) {
          issues.tagMismatch.push({ id: doc.id, subject: d.subject, tag, expected: expectedPrefixes });
        }
      }
    });
  }
  
  // Report
  console.log(`📊 檢查 ${total} 題\n`);
  
  console.log(`=== ID vs Data 不一致: ${issues.idMismatch.length} ===`);
  issues.idMismatch.forEach(x => console.log(`  ${x.id}:`, JSON.stringify(x)));
  
  console.log(`\n=== 無詳解: ${issues.noExp.length} ===`);
  issues.noExp.forEach(x => console.log(`  ${x}`));
  
  console.log(`\n=== 詳解不完整: ${issues.incompleteExp.length} ===`);
  issues.incompleteExp.slice(0, 20).forEach(x => console.log(`  ${x.id}: 缺 ${x.missing}`));
  if (issues.incompleteExp.length > 20) console.log(`  ... 及其他 ${issues.incompleteExp.length - 20} 項`);
  
  console.log(`\n=== 詳解標記不一致: ${issues.expMismatch.length} ===`);
  issues.expMismatch.forEach(x => console.log(`  ${x.id}: DB=${x.dbAns} Exp=${x.expAns}`));
  
  console.log(`\n=== 無 Tag: ${issues.noTag.length} ===`);
  issues.noTag.slice(0, 20).forEach(x => console.log(`  ${x}`));
  if (issues.noTag.length > 20) console.log(`  ... 及其他 ${issues.noTag.length - 20} 項`);
  
  console.log(`\n=== Tag 與科目不匹配: ${issues.tagMismatch.length} ===`);
  issues.tagMismatch.slice(0, 30).forEach(x => console.log(`  ${x.id}: subject=${x.subject} tag="${x.tag}" expected含: ${x.expected.join('/')}`));
  if (issues.tagMismatch.length > 30) console.log(`  ... 及其他 ${issues.tagMismatch.length - 30} 項`);
  
  console.log('\n=== 總結 ===');
  console.log(`  ID不一致: ${issues.idMismatch.length}`);
  console.log(`  無詳解: ${issues.noExp.length}`);
  console.log(`  詳解不完整: ${issues.incompleteExp.length}`);
  console.log(`  詳解標記錯: ${issues.expMismatch.length}`);
  console.log(`  無Tag: ${issues.noTag.length}`);
  console.log(`  Tag不匹配: ${issues.tagMismatch.length}`);
  
  fs.writeFileSync(require('path').join(__dirname, '../reports/full_quality_report.json'), JSON.stringify(issues, null, 2), 'utf-8');
  console.log('\n📁 完整報告存入 ../reports/full_quality_report.json');
  process.exit();
}

run();
