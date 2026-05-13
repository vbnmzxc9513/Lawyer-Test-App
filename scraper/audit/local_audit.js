/**
 * local_audit.js — 本地資料品質檢查（不需 Firestore）
 * 
 * 從 data/{year}_complete.json 讀取，檢查：
 * 1. 題數完整性
 * 2. 答案 vs 官方
 * 3. 詳解完整性 + optionAnalysis 標記一致性
 * 4. Tag 合理性
 * 5. 題目 vs 詳解語意交叉
 */
const fs = require('fs');
const path = require('path');

// Official answers from PDFs
const OFFICIAL_ANSWERS = {
  111: {
    '2301': [null,'B','D','C','B','C','D','A','A','C','A','B','B','C','A','D','B','C','A','D','A','A','B','D','D','B','C','C','A','D','C','B','A','D','B','C','D','D','D','B','A','D','A','C','B','A','B','D','C','D','C','B','D','A','A','C','D','B','C','D','D','A','C','C','B','B','A','D','D','B','D','B','B','D','C','D'],
    '1301': [null,'B','D','D','B','B','D','A','D','B','D','B','C','D','A','A','D','B','D','C','D','C','A','B','B','D','D','C','D','D','A','C','C','C','A','C','B','B','C','C','D','B','C','D','B','D','A','C','A','C','B','A','B','A','B','B','D','C','C','C','B','C','D','B','C','C','A','D','B','B','A','B','D','B','A','C'],
    '3301': [null,'D','B','A','D','A','C','D','D','D','A','A','B','C','C','A','B','D','B','D','D','A','A','D','A','C','B','B','C','C','A','A','D','D','B','B','B','A','C','B','B','D','A','C','C','D','B','B','B','D','A','C','B','A','D','D','A','D','B','D','B','A','D','C','B','C','B','D','D','A','B','A','A','D','D','B','D','B','A','B','B'],
    '4301': [null,'C','A','C','D','C','B','A','A','C','A','B','D','D','C','C','C','B','D','C','D','A','A','C','B','A','B','B','B','D','C','D','A','D','C','B','D','A','A','C','A','B','A','B','D','C','D','C','B','C','B','C','B','A','D','D','A','D','B','D','B','A','D','C','B','C','B','D','D','A','B']
  },
  112: {
    '2301': [null,'D','D','A','D','D','A','D','A','B','B','D','C','A','C','A','D','B','D','A','C','B','D','B','D','D','A','B','D','A','C','D','B','B','D','A','D','D','C','A','B','D','A','A','D','D','C','B','C','A','D','B','C','D','C','D','A','D','C','D','B','C','B','B','B','A','B','B','D','C','A','B','A','C','C','D'],
    '1301': [null,'A','C','B','B','D','A','A','B','B','D','A','B','C','A','C','D','A','C','A','B','B','B','A','D','C','B','D','D','A','D','B','C','B','A','C','A','B','D','A','C','D','B','A','D','D','B','C','C','A','C','B','A','C','A','D','D','C','D','C','C','D','B','A','C','D','A','D','D','B','B','A','B','D','A','D'],
    '3301': [null,'D','C','A','B','B','D','B','A','D','B','C','B','C','B','A','A','D','C','C','D','A','D','C','D','A','D','C','D','D','B','B','A','D','A','D','B','D','A','B','A','C','B','C','D','C','D','B','C','C','D','B','A','D','D','D','C','A','D','B','D','B','A','D','C','B','C','B','D','D','A','B','A','A','D','D','B','D','B','A','B'],
    '4301': [null,'B','C','B','D','A','D','C','A','D','C','B','A','C','D','B','C','D','B','A','C','D','B','B','C','A','C','D','B','C','B','D','C','C','D','C','A','D','B','B','C','A','D','B','D','A','B','B','C','D','A','D','A','B','C','D','C','D','A','B','A','D','C','B','D','A','D','C','D','C','C']
  },
  113: {
    '2301': [null,'C','A','D','C','D','A','D','A','D','A','D','B','C','A','C','A','B','A','D','D','B','C','B','D','C','A','B','C','A','A','D','D','D','B','A','D','A','D','A','B','A','C','D','B','C','A','D','D','D','B','B','B','A','B','A','C','B','D','C','C','C','B','B','A','A','B','C','D','D','B','A','C','C','C','B'],
    '1301': [null,'B','D','D','B','B','D','A','D','B','D','B','C','D','A','A','D','B','D','C','D','C','A','B','B','D','D','C','D','D','A','C','C','C','A','C','B','B','C','C','D','B','C','A','C','D','C','B','C','B','C','B','A','B','A','B','B','D','C','D','B','C','B','B','D','D','A','D','A','B','B','A','C'],
    '3301': [null,'D','C','C','B','B','A','C','B','C','B','B','B','C','A','C','A','D','B','C','C','B','B','C','D','D','B','A','A','B','C','A','C','A','C','C','D','A','C','C','B','D','B','C','A','A','B','B','B','D','A','D'],
    '4301': [null,'B','D','A','B','A','D','C','A','D','C','C','C','C','D','B','D','B','A','C','D','B','A','B','C','B','C','D','B','C','B','D','C','C','D','C','A','D','D','B','C','A','D','B','D','A','B','B','C','D','A','D','A','B','C','D','C','D','A','B','A','D','C','B','D','A','D','C','D','C','C']
  },
  114: {
    '301': [null,'C','D','B','D','D','D','A','D','A','B','A','C','B','D','A','C','B','C','B','D','A','A','B','D','A','B','D','D','B','A','C','C','A','B','A','A','D','D','B','C','B','C','D','C','C','A','C','D','B','D','C','A','B','C','C','A','D','B','C','D','D','B','C','A','C','B','A','A','D','B','B','D','D','C','A'],
    '302': [null,'A','C','B','B','D','A','A','B','B','D','A','B','C','A','C','D','B','D','A','D','D','B','B','A','D','C','B','D','D','A','B','C','B','A','C','C','D','B','A','C','D','B','A','A','A','B','D','D','A','C','B','D','B','A','D','B','C','D','C','C','D','B','C','D','B','A','D','D','B','B','A','B','D','A','D'],
    '303': [null,'C','D','C','D','D','B','D','B','C','B','C','B','D','D','C','B','D','A','B','D','D','A','D','B','A','C','C','A','C','B','C','A','B','A','B','A','C','A','C','A','B','C','B','C','B','D','A','B','D','A','A','C','D','B','B','D','C','B','D','B','D','C','D','B','D','B','D','B','D','A','D','A','D','C','A','C','B','C','B','A'],
    '304': [null,'A','C','A','C','D','A','B','C','D','B','C','B','C','D','D','D','D','A','A','D','D','B','D','A','B','C','D','B','C','B','B','C','C','D','C','B','A','B','A','D','A','B','C','B','D','C','D','C','D','A','C','A','B','C','D','B','D','A','B','A']
  }
};

// Subject expected in each paper
const PAPER_SUBJECTS = {
  '2301': ['constitutional','administrative','international_public','international_private'],
  '1301': ['criminal','criminal_procedure','legal_ethics'],
  '3301': ['civil','civil_procedure'],
  '4301': ['company','insurance','negotiable_instruments','securities','enforcement','legal_english'],
  '301': ['constitutional','administrative','international_public','international_private'],
  '302': ['criminal','criminal_procedure','legal_ethics'],
  '303': ['civil','civil_procedure'],
  '304': ['company','insurance','negotiable_instruments','securities','enforcement','legal_english']
};

const SUBJECT_TAG_MAP = {
  constitutional: ['憲法'],
  administrative: ['行政法'],
  international_public: ['國際公法','國公'],
  international_private: ['國際私法','國私'],
  criminal: ['刑法'],
  criminal_procedure: ['刑訴','刑事訴訟'],
  legal_ethics: ['法倫','法律倫理'],
  civil: ['民法'],
  civil_procedure: ['民訴','民事訴訟'],
  company: ['公司法','公司'],
  insurance: ['保險法','保險'],
  negotiable_instruments: ['票據法','票據'],
  securities: ['證交法','證券','證交'],
  enforcement: ['強制執行','強執'],
  legal_english: ['法英','法學英文']
};

function smartDetectAnswer(oa) {
  if (!oa) return null;
  
  // Explicit markers
  for (const opt of ['A','B','C','D']) {
    const t = oa[opt] || '';
    if (t.includes('本題答案') || t.match(/答案[A-D]/) || t.includes('(答案)') || t.includes('（答案）'))
      return opt;
  }
  
  // Single checkmark
  const withCheck = [];
  for (const opt of ['A','B','C','D']) {
    if ((oa[opt]||'').includes('✅')) withCheck.push(opt);
  }
  if (withCheck.length === 1) return withCheck[0];
  
  // Find-wrong format
  const correct = [], wrong = [];
  for (const opt of ['A','B','C','D']) {
    const t = oa[opt] || '';
    if (t.startsWith('正確') || t.startsWith('【正確】')) correct.push(opt);
    if (t.startsWith('錯誤') || t.startsWith('【錯誤')) wrong.push(opt);
  }
  if (wrong.length === 1 && correct.length >= 2) return wrong[0];
  if (correct.length === 1 && wrong.length >= 2) return correct[0];
  
  return null;
}

function extractKeyTerms(text) {
  if (!text) return [];
  const terms = new Set();
  const patterns = [
    /物權|債權|侵權|契約|不當得利|占有|抵押|時效|善意取得|代位|連帶/g,
    /婚姻|離婚|收養|監護|親權|繼承|遺囑|遺產|特留分/g,
    /訴訟|管轄|送達|證據|判決|上訴|再審|強制執行|假扣押|假處分/g,
    /殺人|傷害|竊盜|搶奪|強盜|詐欺|背信|侵占|偽造/g,
    /故意|過失|正當防衛|緊急避難|未遂|共犯|教唆|累犯|緩刑/g,
    /偵查|起訴|羈押|搜索|扣押|自白|辯護|非常上訴/g,
    /基本權|平等|比例原則|法律保留|違憲審查|大法官|憲法法庭/g,
    /行政處分|行政契約|行政罰|訴願|行政訴訟|國家賠償/g,
    /公司|股東|董事|監察人|合併|清算|保險|票據|匯票|支票|背書/g,
    /證券|內線交易|短線交易/g,
    /引渡|條約|國際法|主權|外交|準據法/g,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) m.forEach(t => terms.add(t));
  }
  return [...terms];
}

function auditYear(year) {
  const filepath = path.join(__dirname, '..', 'data', `${year}_complete.json`);
  if (!fs.existsSync(filepath)) {
    console.log(`  ❌ ${filepath} 不存在`);
    return null;
  }
  
  const questions = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  const issues = { answerWrong: [], expMismatch: [], noExp: [], shortExp: [], thinOA: [], tagMismatch: [], noTag: [], semantic: [] };
  
  for (const q of questions) {
    const parts = q.id.split('-');
    const paper = parts[1];
    const qnum = q.questionNumber;
    
    // 1. Answer check vs official
    const officialAns = OFFICIAL_ANSWERS[year]?.[paper]?.[qnum];
    if (officialAns && q.answer !== officialAns) {
      issues.answerWrong.push({ id: q.id, db: q.answer, official: officialAns });
    }
    
    // 2. Explanation checks
    if (!q.explanation) {
      issues.noExp.push(q.id);
    } else {
      const cc = q.explanation.coreConcept || '';
      const ce = q.explanation.coreExplanation || '';
      
      // Short check
      if (cc.length + ce.length < 30) {
        issues.shortExp.push({ id: q.id, len: cc.length + ce.length });
      }
      
      // Option analysis marking
      if (q.explanation.optionAnalysis) {
        const detected = smartDetectAnswer(q.explanation.optionAnalysis);
        if (detected && detected !== q.answer) {
          issues.expMismatch.push({ id: q.id, answer: q.answer, detected });
        }
        
        // Thin OA
        let thin = 0;
        for (const opt of ['A','B','C','D']) {
          if (!(q.explanation.optionAnalysis[opt]) || q.explanation.optionAnalysis[opt].length < 10) thin++;
        }
        if (thin >= 2) issues.thinOA.push(q.id);
      }
      
      // Semantic check
      const qTerms = extractKeyTerms(q.questionText);
      const expTerms = extractKeyTerms(cc + ' ' + ce);
      if (qTerms.length >= 2 && expTerms.length >= 2) {
        const overlap = qTerms.filter(t => expTerms.includes(t)).length;
        if (overlap === 0) {
          issues.semantic.push({ id: q.id, qTerms: qTerms.slice(0,4), expTerms: expTerms.slice(0,4) });
        }
      }
    }
    
    // 3. Tag check
    if (!q.tag || q.tag.trim() === '') {
      issues.noTag.push(q.id);
    } else {
      const expected = SUBJECT_TAG_MAP[q.subject] || [];
      if (expected.length > 0 && !expected.some(p => q.tag.includes(p))) {
        issues.tagMismatch.push({ id: q.id, subject: q.subject, tag: q.tag.substring(0, 50) });
      }
    }
  }
  
  return { year, total: questions.length, issues };
}

// Run
console.log('🔍 本地資料品質檢查\n');

const allResults = [];
for (const year of [111, 112, 113, 114]) {
  const r = auditYear(year);
  if (!r) continue;
  allResults.push(r);
  
  const i = r.issues;
  console.log(`\n${year}年 (${r.total}題):`);
  console.log(`  答案錯誤: ${i.answerWrong.length}`);
  console.log(`  無詳解: ${i.noExp.length}`);
  console.log(`  詳解過短: ${i.shortExp.length}`);
  console.log(`  標記不一致: ${i.expMismatch.length}`);
  console.log(`  選項分析薄弱: ${i.thinOA.length}`);
  console.log(`  語意零重疊: ${i.semantic.length}`);
  console.log(`  無Tag: ${i.noTag.length}`);
  console.log(`  Tag不匹配: ${i.tagMismatch.length}`);
  
  if (i.answerWrong.length > 0) {
    i.answerWrong.forEach(x => console.log(`    ❌ ${x.id}: local=${x.db} official=${x.official}`));
  }
}

// Summary
console.log('\n=== 總結 ===');
const totals = { total: 0, answerWrong: 0, noExp: 0, shortExp: 0, expMismatch: 0, thinOA: 0, semantic: 0, noTag: 0, tagMismatch: 0 };
allResults.forEach(r => {
  totals.total += r.total;
  Object.keys(r.issues).forEach(k => { totals[k] = (totals[k]||0) + r.issues[k].length; });
});
Object.entries(totals).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

// Save report
const report = {};
allResults.forEach(r => { report[r.year] = r.issues; });
const reportPath = path.join(__dirname, '..', 'reports', 'local_audit_report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log('\n📁 報告存入', reportPath);
