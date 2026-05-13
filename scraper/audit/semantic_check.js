/**
 * semantic_check.js — 語意交叉比對（讀取本地 JSON）
 * 從題目文字中提取關鍵詞，與 coreConcept/coreExplanation 比對
 * 找出詳解內容可能跟題目完全無關的案例
 */
const fs = require('fs');
const path = require('path');

// Extract key legal terms from text
function extractKeyTerms(text) {
  if (!text) return [];
  const patterns = [
    // Civil
    /物權|債權|侵權|契約|不當得利|占有|抵押|質權|留置|地上權|典權|時效|善意取得|代位|連帶/g,
    /婚姻|離婚|收養|監護|親權|繼承|遺囑|遺產|特留分|應繼分/g,
    /損害賠償|消滅時效|請求權|法律行為|意思表示|代理|無權處分|善意第三人/g,
    // Civil Procedure
    /訴訟|管轄|送達|期日|證據|判決|上訴|抗告|再審|強制執行|假扣押|假處分|調解|仲裁/g,
    /當事人能力|訴訟能力|共同訴訟|參加|反訴|變更|追加|撤回/g,
    // Criminal
    /殺人|傷害|竊盜|搶奪|強盜|恐嚇|詐欺|背信|侵占|偽造|公然侮辱|誹謗|妨害/g,
    /故意|過失|正當防衛|緊急避難|不能犯|未遂|共犯|教唆|幫助|累犯|自首|緩刑/g,
    // Criminal Procedure
    /偵查|起訴|羈押|搜索|扣押|通訊監察|自白|證人|鑑定|辯護|上訴|非常上訴/g,
    // Constitutional
    /基本權|平等|自由|比例原則|法律保留|正當程序|違憲審查|大法官|憲法法庭/g,
    // Administrative
    /行政處分|行政契約|行政指導|行政罰|行政執行|訴願|行政訴訟|國家賠償/g,
    // Commercial
    /公司|股東|董事|監察人|股份|合併|分割|清算|破產|保險|票據|匯票|本票|支票|背書/g,
    /證券|內線交易|公開收購|短線交易|操縱市場/g,
    // International
    /引渡|條約|國際法|主權|外交|領事|庇護|管轄權|涉外|準據法/g,
  ];
  
  const terms = new Set();
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) matches.forEach(m => terms.add(m));
  }
  return [...terms];
}

function overlapScore(terms1, terms2) {
  if (terms1.length === 0 || terms2.length === 0) return -1; // can't determine
  const set1 = new Set(terms1);
  const set2 = new Set(terms2);
  let overlap = 0;
  for (const t of set1) if (set2.has(t)) overlap++;
  return overlap;
}

function run() {
  console.log('🔍 語意交叉比對（本地 JSON）...\n');
  
  const suspicious = [];
  const shortExp = [];
  const thinOA = [];
  let total = 0;
  
  for (const year of [111, 112, 113, 114]) {
    const filePath = path.join(__dirname, '..', 'data', `${year}_complete.json`);
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    for (const d of questions) {
      total++;
      const exp = d.explanation;
      if (!exp) return;
      
      const qText = d.questionText || '';
      const cc = exp.coreConcept || '';
      const ce = exp.coreExplanation || '';
      const expText = cc + ' ' + ce;
      
      // 1. Short explanation check
      if (cc.length + ce.length < 30) {
        shortExp.push({ id: d.id, ccLen: cc.length, ceLen: ce.length, cc });
      }
      
      // 2. Thin optionAnalysis
      const oa = exp.optionAnalysis || {};
      let thinCount = 0;
      for (const opt of ['A', 'B', 'C', 'D']) {
        if (!oa[opt] || oa[opt].length < 10) thinCount++;
      }
      if (thinCount >= 2) {
        thinOA.push({ id: d.id, thinCount, sample: Object.entries(oa).map(([k,v])=>`${k}:${(v||'').length}`).join(' ') });
      }
      
      // 3. Semantic mismatch check
      const qTerms = extractKeyTerms(qText);
      const expTerms = extractKeyTerms(expText);
      
      if (qTerms.length >= 2 && expTerms.length >= 2) {
        const score = overlapScore(qTerms, expTerms);
        if (score === 0) {
          suspicious.push({
            id: d.id,
            subject: d.subject,
            qTerms: qTerms.slice(0, 5).join(', '),
            expTerms: expTerms.slice(0, 5).join(', '),
            qSnippet: qText.substring(0, 80),
            ccSnippet: cc.substring(0, 80)
          });
        }
      }
    }
  }
  
  console.log(`📊 檢查 ${total} 題\n`);
  
  console.log(`=== 短詳解 (${shortExp.length}) ===`);
  shortExp.forEach(x => console.log(`  ${x.id}: cc=${x.ccLen} ce=${x.ceLen} "${x.cc}"`));
  
  console.log(`\n=== 薄選項分析 (${thinOA.length}) ===`);
  thinOA.slice(0, 15).forEach(x => console.log(`  ${x.id}: ${x.thinCount}項過短 [${x.sample}]`));
  if (thinOA.length > 15) console.log(`  ... 共 ${thinOA.length} 題`);
  
  console.log(`\n=== 語意零重疊(可能詳解錯題) (${suspicious.length}) ===`);
  suspicious.forEach(x => {
    console.log(`  ${x.id}`);
    console.log(`    題目: ${x.qSnippet}`);
    console.log(`    詳解: ${x.ccSnippet}`);
    console.log(`    題目關鍵詞: ${x.qTerms}`);
    console.log(`    詳解關鍵詞: ${x.expTerms}`);
  });
  
  fs.writeFileSync(path.join(__dirname, '../reports/semantic_report.json'), JSON.stringify({ suspicious, shortExp, thinOA }, null, 2), 'utf-8');
  console.log('\n📁 報告存入 ../reports/semantic_report.json');
}

run();
