/**
 * ultimate_audit.js
 * 地毯式診斷 111-113 年題庫所有瑕疵
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();
const fs = require('fs');

async function run() {
  const years = ['111', '112', '113'];
  const issues = [];
  const stats = { total: 0, healthy: 0 };

  for (const yr of years) {
    console.log(`\n🔎 正在診斷 ${yr} 年...`);
    const data = JSON.parse(fs.readFileSync(`data/${yr}_complete.json`));
    
    for (let i = 0; i < data.length; i++) {
      const q = data[i];
      stats.total++;
      const id = q.id;
      const doc = await db.collection('questions').doc(id).get();
      
      if (!doc.exists) {
        issues.push({ id, type: 'MISSING_IN_FIRESTORE', severity: 'HIGH' });
        continue;
      }
      
      const d = doc.data();
      const exp = d.explanation || {};
      const errors = [];

      // 1. 漏詳解
      if (!exp.coreConcept && !exp.coreExplanation) {
        errors.push('MISSING_EXPLANATION');
      } else {
        // 2. 解答與詳解不符 (Answer Mismatch)
        const officialAns = d.answer;
        const analysis = exp.optionAnalysis || {};
        const correctMarkerCount = Object.entries(analysis).filter(([k, v]) => v && v.includes('【正確答案】')).length;
        
        if (correctMarkerCount > 0) {
          const markedAns = Object.entries(analysis).find(([k, v]) => v && v.includes('【正確答案】'))?.[0];
          if (markedAns !== officialAns) {
            errors.push(`ANSWER_MISMATCH (Field:${officialAns} vs Marker:${markedAns})`);
          }
        }
        
        // 3. 爛詳解 (Quality)
        if (exp.analogy && exp.analogy.length < 15) errors.push('ANALOGY_TOO_SHORT');
        if (exp.coreExplanation && exp.coreExplanation.length < 20) errors.push('EXP_TOO_SHORT');
        
        const genericPhrases = ['依具體題目選項分析', '本題考點涉及', '本題測驗'];
        if (genericPhrases.some(p => exp.coreConcept?.includes(p)) && exp.coreConcept?.length < 30) {
          errors.push('GENERIC_TEMPLATE_DETECTED');
        }
      }

      // 4. 題目瑕疵 (Data Integrity)
      if (!d.questionText || d.questionText.length < 5) errors.push('EMPTY_QUESTION_TEXT');
      if (!d.options || Object.keys(d.options).length < 4) errors.push('INCOMPLETE_OPTIONS');

      if (errors.length > 0) {
        issues.push({ id, type: 'MULTIPLE_FLAWS', details: errors, severity: errors.some(e => e.includes('MISMATCH') || e.includes('MISSING')) ? 'HIGH' : 'MEDIUM' });
      } else {
        stats.healthy++;
      }

      if (i % 50 === 0 && i > 0) process.stdout.write('.');
      await new Promise(r => setTimeout(r, 25));
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    stats,
    issueCount: issues.length,
    highSeverity: issues.filter(i => i.severity === 'HIGH'),
    mediumSeverity: issues.filter(i => i.severity === 'MEDIUM'),
    allIssues: issues
  };

  fs.writeFileSync('ultimate_audit_report.json', JSON.stringify(report, null, 2));
  
  console.log(`\n\n${'='.repeat(40)}`);
  console.log(`🏁 診斷完成！`);
  console.log(`總檢查題數: ${stats.total}`);
  console.log(`✅ 完全健康: ${stats.healthy}`);
  console.log(`❌ 發現瑕疵: ${issues.length}`);
  console.log(`${'='.repeat(40)}`);
  
  if (issues.length > 0) {
    console.log(`\n前 10 個瑕疵清單:`);
    issues.slice(0, 10).forEach(iss => console.log(`- [${iss.severity}] ${iss.id}: ${iss.type} (${iss.details ? iss.details.join(', ') : ''})`));
    console.log(`\n完整報告已存至 ultimate_audit_report.json`);
  }
  
  process.exit();
}
run();
