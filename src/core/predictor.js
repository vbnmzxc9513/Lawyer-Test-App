import { storage } from '../utils/storage.js';

export const predictor = {
  // 分數權重 (根據司律一試各科配分)
  subjectWeights: {
    constitutional: 40,
    administrative: 70,
    criminal: 70,
    criminal_procedure: 50,
    international_public: 20,
    international_private: 20,
    legal_ethics: 30,
    civil: 100,
    civil_procedure: 60,
    company: 30,
    insurance: 20,
    negotiable_instruments: 20,
    securities: 20,
    enforcement: 20,
    legal_english: 30
  },
  
  // 歷年平均錄取線 (以 113年為基準)
  cutoff: {
    lawyer: 354,
    judge: 362
  },

  /**
   * 預估總分
   */
  predictScore() {
    const stats = storage.getSubjectStats();
    let estimatedScore = 0;
    
    // 如果沒有任何紀錄，預估為 0
    if (Object.keys(stats).length === 0) return 0;

    // 將所有科目的預估分數加總
    Object.keys(this.subjectWeights).forEach(subject => {
      const weight = this.subjectWeights[subject];
      if (stats[subject]) {
        // 使用真實作答正確率
        estimatedScore += (stats[subject].accuracy / 100) * weight;
      } else {
        // 如果該科沒做過，用全體平均正確率或是 0 來估算
        // 為了不讓分數過度樂觀，這裡先以 0 計 (或可改為 33% 猜測機率)
        estimatedScore += 0.33 * weight; // 猜測機率
      }
    });

    return Math.round(estimatedScore);
  },

  /**
   * 計算上榜機率
   */
  calculateProbability() {
    const score = this.predictScore();
    
    const calculateProb = (target) => {
      if (score >= target + 20) return 99;
      if (score >= target) return 80 + Math.min(19, (score - target));
      if (score >= target - 20) return 40 + (score - (target - 20)) * 2;
      if (score >= target - 50) return 10 + (score - (target - 50));
      return 5;
    };

    return {
      score,
      lawyerProb: calculateProb(this.cutoff.lawyer),
      judgeProb: calculateProb(this.cutoff.judge)
    };
  }
};
