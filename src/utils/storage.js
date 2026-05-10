import { db } from '../core/firebase.js';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

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
  async saveQuizHistory(historyRecords) {
    try {
      const existingHistory = this.getAllHistory();
      const newHistory = [...existingHistory, ...historyRecords];
      localStorage.setItem(this.KEY_HISTORY, JSON.stringify(newHistory));

      // 若已登入，同步至 Firestore
      if (window.currentUser) {
        const uid = window.currentUser.uid;
        const historyRef = collection(db, `users/${uid}/history`);
        for (const record of historyRecords) {
          await addDoc(historyRef, record);
        }
      }
      return true;
    } catch (e) {
      console.error("儲存歷史紀錄失敗:", e);
      return false;
    }
  },

  /**
   * 同步 Firestore 紀錄到本地 (登入時呼叫)
   */
  async syncHistoryFromFirestore() {
    if (!window.currentUser) return;
    try {
      const uid = window.currentUser.uid;
      const historyRef = collection(db, `users/${uid}/history`);
      const snap = await getDocs(historyRef);
      if (!snap.empty) {
        const firestoreHistory = snap.docs.map(d => d.data());
        // 簡單合併與去重 (利用 timestamp 與 questionId)
        const localHistory = this.getAllHistory();
        const combined = [...localHistory, ...firestoreHistory];
        const uniqueHistoryMap = new Map();
        combined.forEach(record => {
          const key = `${record.questionId}_${record.timestamp}`;
          uniqueHistoryMap.set(key, record);
        });
        const finalHistory = Array.from(uniqueHistoryMap.values());
        // 依時間排序
        finalHistory.sort((a, b) => a.timestamp - b.timestamp);
        localStorage.setItem(this.KEY_HISTORY, JSON.stringify(finalHistory));
      }
    } catch (e) {
      console.error("同步 Firestore 歷史紀錄失敗:", e);
    }
  },

  /**
   * 取得錯題紀錄 (錯題本用)
   */
  getMistakes() {
    const history = this.getAllHistory();
    // 過濾出答錯的題目，並透過 questionId 去除重複，只保留最新一次的錯誤紀錄
    const mistakesMap = {};
    history.forEach(record => {
      if (!record.isCorrect) {
        mistakesMap[record.questionId] = record;
      } else {
        // 如果後來答對了，可以考慮從錯題本移除
        delete mistakesMap[record.questionId];
      }
    });
    return Object.values(mistakesMap);
  },

  /**
   * 按科目篩選錯題
   * @param {string} subject
   */
  getMistakesBySubject(subject) {
    return this.getMistakes().filter(m => m.subject === subject);
  },

  /**
   * 從錯題本移除指定題目
   * 原理：插入一筆「虛擬答對」紀錄，使 getMistakes() 自動過濾掉該題
   * @param {string} questionId
   */
  removeMistake(questionId) {
    try {
      const history = this.getAllHistory();
      // 找到該題的最近一筆錯誤紀錄以取得 subject 和 tags 資訊
      const lastWrong = [...history].reverse().find(r => r.questionId === questionId && !r.isCorrect);
      const syntheticRecord = {
        questionId,
        subject: lastWrong?.subject || 'unknown',
        userAnswer: lastWrong?.correctAnswer || 'A',
        correctAnswer: lastWrong?.correctAnswer || 'A',
        isCorrect: true,
        tags: lastWrong?.tags || [],
        timestamp: Date.now(),
        _removedFromMistakes: true // 標記為手動移除
      };
      history.push(syntheticRecord);
      localStorage.setItem(this.KEY_HISTORY, JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('移除錯題失敗:', e);
      return false;
    }
  },

  /**
   * 批次移除多道錯題
   * @param {Array<string>} questionIds
   */
  removeMistakesByIds(questionIds) {
    for (const id of questionIds) {
      this.removeMistake(id);
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
  },

  /**
   * 取得科目→觀念標籤 分層統計（大類+小類）
   * 回傳: { [subjectId]: { total, correct, accuracy, tags: { [tag]: { total, correct, accuracy } } } }
   */
  getSubjectTagStats() {
    const history = this.getAllHistory();
    const stats = {};

    history.forEach(record => {
      const subject = record.subject;
      if (!subject) return;

      if (!stats[subject]) {
        stats[subject] = { total: 0, correct: 0, accuracy: 0, tags: {} };
      }
      stats[subject].total++;
      if (record.isCorrect) stats[subject].correct++;

      // 統計每個 tag 在該科目下的表現
      const tags = record.tags || [];
      tags.forEach(tag => {
        if (!stats[subject].tags[tag]) {
          stats[subject].tags[tag] = { total: 0, correct: 0, accuracy: 0 };
        }
        stats[subject].tags[tag].total++;
        if (record.isCorrect) stats[subject].tags[tag].correct++;
      });
    });

    // 計算正確率
    Object.keys(stats).forEach(sub => {
      stats[sub].accuracy = stats[sub].total > 0
        ? (stats[sub].correct / stats[sub].total) * 100 : 0;
      Object.keys(stats[sub].tags).forEach(tag => {
        const t = stats[sub].tags[tag];
        t.accuracy = t.total > 0 ? (t.correct / t.total) * 100 : 0;
      });
    });

    return stats;
  },

  /**
   * 取得總覽統計
   */
  getOverviewStats() {
    const history = this.getAllHistory();
    if (history.length === 0) return null;

    const total = history.length;
    const correct = history.filter(h => h.isCorrect).length;
    const subjects = new Set(history.map(h => h.subject).filter(Boolean));
    const mistakes = this.getMistakes();

    // 計算作答天數
    const days = new Set(history.map(h =>
      new Date(h.timestamp).toISOString().split('T')[0]
    ));

    return {
      totalAttempted: total,
      totalCorrect: correct,
      overallAccuracy: total > 0 ? (correct / total) * 100 : 0,
      subjectsCovered: subjects.size,
      mistakeCount: mistakes.length,
      daysActive: days.size,
      uniqueQuestions: new Set(history.map(h => h.questionId)).size
    };
  }
};
