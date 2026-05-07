import { storage } from '../utils/storage.js';

export const ACHIEVEMENTS = [
  { id: 'first_blood', name: '初出茅廬', desc: '完成第一次測驗', icon: '🌱', threshold: 1, type: 'total_tests' },
  { id: 'hundred_questions', name: '百題斬', desc: '累計完成 100 題', icon: '⚔️', threshold: 100, type: 'total_questions' },
  { id: 'perfect_score', name: '全對達人', desc: '單次練習全對', icon: '🎯', type: 'special' },
  { id: 'overcome_weakness', name: '觀念突破者', desc: '單一觀念正確率超過 80%', icon: '🔥', type: 'special' }
];

export const achievementSystem = {
  /**
   * 檢查是否有新解鎖的成就
   * @param {Object} currentSummary - 本次測驗的統計結果
   */
  checkAchievements(currentSummary) {
    const history = storage.getAllHistory();
    const unlocked = this.getUnlockedAchievements();
    const newUnlocked = [];

    const totalQuestions = history.length;
    const totalTests = new Set(history.map(h => h.timestamp)).size;

    ACHIEVEMENTS.forEach(ach => {
      if (unlocked.includes(ach.id)) return; // 已經解鎖過了

      let isUnlocked = false;

      if (ach.type === 'total_tests' && totalTests >= ach.threshold) {
        isUnlocked = true;
      } else if (ach.type === 'total_questions' && totalQuestions >= ach.threshold) {
        isUnlocked = true;
      } else if (ach.id === 'perfect_score' && currentSummary.accuracy === 100 && currentSummary.totalQuestions > 0) {
        isUnlocked = true;
      } else if (ach.id === 'overcome_weakness') {
        const tagStats = storage.getTagStats();
        // 檢查是否有觀念正確率超過 80% 且至少做過 3 題
        isUnlocked = Object.values(tagStats).some(stat => stat.total >= 3 && stat.accuracy >= 80);
      }

      if (isUnlocked) {
        newUnlocked.push(ach);
        this.saveUnlockedAchievement(ach.id);
      }
    });

    return newUnlocked;
  },

  getUnlockedAchievements() {
    try {
      const data = localStorage.getItem(storage.KEY_ACHIEVEMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveUnlockedAchievement(id) {
    const unlocked = this.getUnlockedAchievements();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem(storage.KEY_ACHIEVEMENTS, JSON.stringify(unlocked));
    }
  }
};
