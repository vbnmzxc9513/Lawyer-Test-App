import { storage } from '../utils/storage.js';

export const spacedRepetition = {
  // 艾賓浩斯遺忘曲線的推薦複習間隔 (毫秒)
  intervals: [
    1 * 24 * 60 * 60 * 1000, // 1天
    3 * 24 * 60 * 60 * 1000, // 3天
    7 * 24 * 60 * 60 * 1000, // 7天
    14 * 24 * 60 * 60 * 1000, // 14天
    30 * 24 * 60 * 60 * 1000  // 30天
  ],

  /**
   * 計算每道題目的複習權重與狀態
   * 權重越高，越需要優先推薦
   */
  calculateReviewWeights() {
    const history = storage.getAllHistory();
    const questionStats = {};

    history.forEach(record => {
      const qid = record.questionId;
      if (!questionStats[qid]) {
        questionStats[qid] = {
          id: qid,
          subject: record.subject,
          tags: record.tags || [],
          attempts: 0,
          correctCount: 0,
          consecutiveCorrect: 0,
          lastAttemptDate: 0,
          weight: 0
        };
      }

      const stat = questionStats[qid];
      stat.attempts++;
      if (record.isCorrect) {
        stat.correctCount++;
        stat.consecutiveCorrect++;
      } else {
        stat.consecutiveCorrect = 0; // 錯了就重新計算連續答對
      }
      
      // 更新最後作答時間
      if (record.timestamp > stat.lastAttemptDate) {
        stat.lastAttemptDate = record.timestamp;
      }
    });

    // 根據遺忘曲線與錯誤率計算權重
    const now = Date.now();
    Object.values(questionStats).forEach(stat => {
      let weight = 0;
      
      // 如果答錯次數多，基礎權重高
      const errorRate = 1 - (stat.correctCount / stat.attempts);
      weight += errorRate * 50;

      // 如果從未連續答對超過 1 次，表示極不穩定，加權
      if (stat.consecutiveCorrect < 1) {
        weight += 30;
      }

      // 檢查是否達到遺忘曲線的複習時間點
      const daysSinceLast = (now - stat.lastAttemptDate) / (24 * 60 * 60 * 1000);
      
      // 依據連續答對次數決定現在該用哪個間隔
      const intervalIndex = Math.min(stat.consecutiveCorrect, this.intervals.length - 1);
      const targetDays = this.intervals[intervalIndex] / (24 * 60 * 60 * 1000);

      // 如果超過了該複習的時間
      if (daysSinceLast >= targetDays) {
        weight += 20 * (daysSinceLast / targetDays); // 超過越久權重越高
      }

      // 針對弱點觀念 (Tag) 進行額外加權
      const tagStats = storage.getTagStats();
      stat.tags.forEach(tag => {
        if (tagStats[tag] && tagStats[tag].accuracy < 60) {
          weight += 15; // 弱點觀念加分
        }
      });

      stat.weight = weight;
    });

    return questionStats;
  },

  /**
   * 取得今日推薦複習的觀念清單
   */
  getTodaysRecommendedTags() {
    const stats = this.calculateReviewWeights();
    
    // 將權重聚合到標籤上
    const tagWeights = {};
    Object.values(stats).forEach(stat => {
      if (stat.weight > 30) { // 只挑選有一定權重的題目
        stat.tags.forEach(tag => {
          if (!tagWeights[tag]) tagWeights[tag] = 0;
          tagWeights[tag] += stat.weight;
        });
      }
    });

    // 排序找出最需要複習的前 3 個觀念
    return Object.entries(tagWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  }
};
