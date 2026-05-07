/**
 * 本地儲存管理器 (MVP 階段使用 localStorage 儲存答題紀錄)
 */
export const storage = {
  KEY_HISTORY: 'lawyer_exam_history',
  KEY_ACHIEVEMENTS: 'lawyer_exam_achievements',

  /**
   * 儲存一次完整的測驗歷史
   * @param {Array} historyRecords - quizEngine.history
   */
  saveQuizHistory(historyRecords) {
    try {
      const existingHistory = this.getAllHistory();
      const newHistory = [...existingHistory, ...historyRecords];
      localStorage.setItem(this.KEY_HISTORY, JSON.stringify(newHistory));
      return true;
    } catch (e) {
      console.error("儲存歷史紀錄失敗:", e);
      return false;
    }
  },

  /**
   * 取得所有歷史紀錄
   */
  getAllHistory() {
    try {
      const data = localStorage.getItem(this.KEY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * 取得特定觀念 (Tag) 的答題紀錄以計算正確率
   */
  getTagStats() {
    const history = this.getAllHistory();
    const stats = {};
    
    history.forEach(record => {
      const tags = record.tags || [];
      tags.forEach(tag => {
        if (!stats[tag]) {
          stats[tag] = { total: 0, correct: 0 };
        }
        stats[tag].total++;
        if (record.isCorrect) {
          stats[tag].correct++;
        }
      });
    });

    Object.keys(stats).forEach(tag => {
      stats[tag].accuracy = (stats[tag].correct / stats[tag].total) * 100;
    });

    return stats;
  },

  /**
   * 取得大科目統計 (用於雷達圖)
   */
  getSubjectStats() {
    const history = this.getAllHistory();
    const stats = {};
    
    history.forEach(record => {
      const subject = record.subject;
      if (!stats[subject]) {
        stats[subject] = { total: 0, correct: 0 };
      }
      stats[subject].total++;
      if (record.isCorrect) {
        stats[subject].correct++;
      }
    });

    Object.keys(stats).forEach(sub => {
      stats[sub].accuracy = (stats[sub].correct / stats[sub].total) * 100;
    });

    return stats;
  },

  /**
   * 取得每日進步趨勢 (用於折線圖)
   */
  getDailyTrend() {
    const history = this.getAllHistory();
    const dailyStats = {};

    history.forEach(record => {
      // 取得日期字串 YYYY-MM-DD
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, correct: 0 };
      }
      dailyStats[date].total++;
      if (record.isCorrect) {
        dailyStats[date].correct++;
      }
    });

    // 轉換成陣列並依日期排序
    return Object.keys(dailyStats).sort().map(date => ({
      date: date.substring(5), // 隱藏年份，顯示 MM-DD
      accuracy: (dailyStats[date].correct / dailyStats[date].total) * 100
    }));
  }
};
