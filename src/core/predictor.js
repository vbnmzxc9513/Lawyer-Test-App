import { storage } from '../utils/storage.js';

/**
 * 司律一試落點預測引擎
 * 
 * 計分方式：
 * - 綜合法學（一）300 分：憲法、行政法、刑法、刑訴、國際公法、國際私法、法律倫理
 * - 綜合法學（二）300 分：民法、民訴、公司法、保險法、票據法、證交法、強執法、法學英文
 * - 總分 600 分
 * 
 * 錄取門檻：
 * - 依全程到考人數取前 33%，因此每年門檻浮動
 */
export const predictor = {
  // 各科配分權重（分數）
  subjectWeights: {
    constitutional: 40,       // 憲法
    administrative: 70,       // 行政法
    criminal: 70,             // 刑法
    criminal_procedure: 50,   // 刑事訴訟法
    international_public: 20, // 國際公法
    international_private: 20,// 國際私法
    legal_ethics: 30,         // 法律倫理
    civil: 100,               // 民法
    civil_procedure: 60,      // 民事訴訟法
    company: 30,              // 公司法
    insurance: 20,            // 保險法
    negotiable_instruments: 20,// 票據法
    securities: 20,           // 證券交易法
    enforcement: 20,          // 強制執行法
    legal_english: 30         // 法學英文
  },

  // 試卷分組
  papers: {
    '綜合法學（一）': {
      subjects: ['constitutional','administrative','criminal','criminal_procedure','international_public','international_private','legal_ethics'],
      totalPoints: 300
    },
    '綜合法學（二）': {
      subjects: ['civil','civil_procedure','company','insurance','negotiable_instruments','securities','enforcement','legal_english'],
      totalPoints: 300
    }
  },

  // 歷年律師一試錄取分數
  historicalCutoffs: {
    113: { lawyer: 354, judge: 362 },
    112: { lawyer: 366, judge: 374 },
    111: { lawyer: 372, judge: 382 },
    110: { lawyer: 402, judge: 408 },
    109: { lawyer: 370, judge: 382 },
    108: { lawyer: 362, judge: 370 },
  },

  // 科目中文名稱
  subjectNames: {
    constitutional: '憲法', administrative: '行政法', criminal: '刑法',
    criminal_procedure: '刑訴', international_public: '國際公法',
    international_private: '國際私法', legal_ethics: '法律倫理',
    civil: '民法', civil_procedure: '民訴', company: '公司法',
    insurance: '保險法', negotiable_instruments: '票據法',
    securities: '證交法', enforcement: '強執法', legal_english: '法學英文'
  },

  /**
   * 計算完整落點預測報告
   */
  getFullReport() {
    const stats = storage.getSubjectStats();
    const history = storage.getAllHistory();

    // ---- 1. 各科分數估算 ----
    const subjectScores = {};
    let totalScore = 0;
    let totalWeight = 0;
    let attemptedSubjects = 0;
    let unattemptedSubjects = [];

    Object.entries(this.subjectWeights).forEach(([subject, weight]) => {
      totalWeight += weight;
      if (stats[subject] && stats[subject].total >= 1) {
        const accuracy = stats[subject].accuracy / 100;
        const score = accuracy * weight;
        subjectScores[subject] = {
          accuracy: stats[subject].accuracy,
          score: Math.round(score * 10) / 10,
          maxScore: weight,
          total: stats[subject].total,
          correct: stats[subject].correct,
          attempted: true
        };
        totalScore += score;
        attemptedSubjects++;
      } else {
        // 未作答科目用猜測機率 25%（四選一）估算
        const guessScore = 0.25 * weight;
        subjectScores[subject] = {
          accuracy: 0,
          score: Math.round(guessScore * 10) / 10,
          maxScore: weight,
          total: 0,
          correct: 0,
          attempted: false
        };
        totalScore += guessScore;
        unattemptedSubjects.push(subject);
      }
    });

    totalScore = Math.round(totalScore);

    // ---- 2. 試卷別分數 ----
    const paperScores = {};
    Object.entries(this.papers).forEach(([paperName, paper]) => {
      let pScore = 0;
      let pMax = 0;
      let pAttempted = 0;
      paper.subjects.forEach(sub => {
        const s = subjectScores[sub];
        pScore += s.score;
        pMax += s.maxScore;
        if (s.attempted) pAttempted++;
      });
      paperScores[paperName] = {
        score: Math.round(pScore),
        maxScore: pMax,
        accuracy: pMax > 0 ? Math.round((pScore / pMax) * 100) : 0,
        attemptedSubjects: pAttempted,
        totalSubjects: paper.subjects.length
      };
    });

    // ---- 3. 信心指數（根據作答量和覆蓋率） ----
    const totalSubjectCount = Object.keys(this.subjectWeights).length;
    const coverageRate = attemptedSubjects / totalSubjectCount;
    const totalQuestions = history.length;
    const sampleConfidence = Math.min(1, totalQuestions / 200); // 200題以上視為足夠
    const confidence = Math.round(((coverageRate * 0.6) + (sampleConfidence * 0.4)) * 100);

    // ---- 4. 錄取線比較 ----
    const cutoffComparison = {};
    Object.entries(this.historicalCutoffs).forEach(([year, cutoffs]) => {
      cutoffComparison[year] = {
        lawyer: {
          cutoff: cutoffs.lawyer,
          gap: totalScore - cutoffs.lawyer,
          pass: totalScore >= cutoffs.lawyer
        },
        judge: {
          cutoff: cutoffs.judge,
          gap: totalScore - cutoffs.judge,
          pass: totalScore >= cutoffs.judge
        }
      };
    });

    // 以近 3 年平均為基準
    const recentYears = Object.keys(this.historicalCutoffs).sort((a, b) => b - a).slice(0, 3);
    const avgLawyerCutoff = Math.round(
      recentYears.reduce((sum, y) => sum + this.historicalCutoffs[y].lawyer, 0) / recentYears.length
    );
    const avgJudgeCutoff = Math.round(
      recentYears.reduce((sum, y) => sum + this.historicalCutoffs[y].judge, 0) / recentYears.length
    );

    // ---- 5. 上榜機率（基於正態分布模擬） ----
    const lawyerGap = totalScore - avgLawyerCutoff;
    const judgeGap = totalScore - avgJudgeCutoff;
    
    const calcProb = (gap) => {
      // 使用 sigmoid 函數模擬，標準差約 30 分
      const prob = 1 / (1 + Math.exp(-gap / 15));
      return Math.round(Math.max(2, Math.min(98, prob * 100)));
    };

    const lawyerProb = calcProb(lawyerGap);
    const judgeProb = calcProb(judgeGap);

    // ---- 6. 弱科策略建議 ----
    const strategies = Object.entries(subjectScores)
      .filter(([, s]) => s.attempted)
      .map(([subject, s]) => {
        // 計算「提升空間分數」= (100% - 目前正確率) × 該科配分
        const potentialGain = ((100 - s.accuracy) / 100) * s.maxScore;
        // 投資報酬率 = 潛在分數 / 科目配分 (配分大的科目ROI更高)
        const roi = potentialGain / s.maxScore * s.maxScore;
        return {
          subject,
          name: this.subjectNames[subject] || subject,
          accuracy: Math.round(s.accuracy),
          currentScore: s.score,
          maxScore: s.maxScore,
          potentialGain: Math.round(potentialGain * 10) / 10,
          roi: Math.round(roi * 10) / 10,
          priority: potentialGain >= 20 ? 'high' : (potentialGain >= 10 ? 'medium' : 'low')
        };
      })
      .sort((a, b) => b.potentialGain - a.potentialGain);

    // 距離律師線差幾分
    const lawyerDeficit = Math.max(0, avgLawyerCutoff - totalScore);

    // ---- 7. 建議訊息 ----
    let verdict, verdictEmoji, verdictClass;
    if (totalScore >= avgJudgeCutoff + 20) {
      verdict = '目前表現優異，已大幅超越歷年司法官錄取線！繼續保持穩定發揮。';
      verdictEmoji = '🏆'; verdictClass = 'excellent';
    } else if (totalScore >= avgLawyerCutoff) {
      verdict = '目前預估分數已達律師錄取線！建議繼續穩固弱科，提升安全邊際。';
      verdictEmoji = '✅'; verdictClass = 'safe';
    } else if (totalScore >= avgLawyerCutoff - 30) {
      verdict = `距離律師錄取線差約 ${lawyerDeficit} 分，屬於邊緣區間。集中火力在以下科目可快速補分。`;
      verdictEmoji = '⚠️'; verdictClass = 'risky';
    } else {
      verdict = `距離律師錄取線差約 ${lawyerDeficit} 分，需要顯著增加讀書時間並調整策略。`;
      verdictEmoji = '🚨'; verdictClass = 'danger';
    }

    return {
      totalScore,
      totalWeight, // 600
      subjectScores,
      paperScores,
      confidence,
      cutoffComparison,
      avgLawyerCutoff,
      avgJudgeCutoff,
      lawyerProb,
      judgeProb,
      lawyerGap,
      judgeGap,
      lawyerDeficit,
      strategies,
      unattemptedSubjects,
      attemptedSubjects,
      totalQuestions: history.length,
      verdict, verdictEmoji, verdictClass,
      recentYears
    };
  },

  // 向下相容舊介面
  predictScore() {
    return this.getFullReport().totalScore;
  },

  calculateProbability() {
    const r = this.getFullReport();
    return { score: r.totalScore, lawyerProb: r.lawyerProb, judgeProb: r.judgeProb };
  }
};
