import { storage } from '../utils/storage.js';
import { db } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const ACHIEVEMENTS = [
  { id: 'first_blood', name: '初出茅廬', desc: '完成第一次測驗', icon: '🌱', threshold: 1, type: 'total_tests' },
  { id: 'ten_questions', name: '小試身手', desc: '累計完成 10 題', icon: '✏️', threshold: 10, type: 'total_questions' },
  { id: 'fifty_questions', name: '半百鍛鍊', desc: '累計完成 50 題', icon: '📝', threshold: 50, type: 'total_questions' },
  { id: 'hundred_questions', name: '百題斬', desc: '累計完成 100 題', icon: '⚔️', threshold: 100, type: 'total_questions' },
  { id: 'three_hundred', name: '三百壯士', desc: '累計完成 300 題', icon: '🛡️', threshold: 300, type: 'total_questions' },
  { id: 'five_hundred', name: '五百精兵', desc: '累計完成 500 題', icon: '🏆', threshold: 500, type: 'total_questions' },
  { id: 'perfect_score', name: '全對達人', desc: '單次練習全對', icon: '🎯', type: 'special' },
  { id: 'overcome_weakness', name: '觀念突破者', desc: '單一觀念正確率超過 80%', icon: '🔥', type: 'special' },
  { id: 'streak_3', name: '三日打火', desc: '連續 3 天練習', icon: '🔥', threshold: 3, type: 'streak' },
  { id: 'streak_7', name: '一週燃燒', desc: '連續 7 天練習', icon: '🔥🔥', threshold: 7, type: 'streak' },
  { id: 'streak_14', name: '兩週堅持', desc: '連續 14 天練習', icon: '🔥🔥🔥', threshold: 14, type: 'streak' },
  { id: 'streak_30', name: '月之戰士', desc: '連續 30 天練習', icon: '💎', threshold: 30, type: 'streak' },
  { id: 'all_subjects', name: '全科涉獵', desc: '至少練習過 10 個科目', icon: '🌈', threshold: 10, type: 'subjects_covered' },
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
    const subjectsCovered = new Set(history.map(h => h.subject).filter(Boolean)).size;
    const currentStreak = this.calculateStreak(history);

    ACHIEVEMENTS.forEach(ach => {
      if (unlocked.includes(ach.id)) return; // 已經解鎖過了

      let isUnlocked = false;

      if (ach.type === 'total_tests' && totalTests >= ach.threshold) {
        isUnlocked = true;
      } else if (ach.type === 'total_questions' && totalQuestions >= ach.threshold) {
        isUnlocked = true;
      } else if (ach.type === 'streak' && currentStreak >= ach.threshold) {
        isUnlocked = true;
      } else if (ach.type === 'subjects_covered' && subjectsCovered >= ach.threshold) {
        isUnlocked = true;
      } else if (ach.id === 'perfect_score' && currentSummary.accuracy === 100 && currentSummary.totalQuestions > 0) {
        isUnlocked = true;
      } else if (ach.id === 'overcome_weakness') {
        const tagStats = storage.getTagStats();
        isUnlocked = Object.values(tagStats).some(stat => stat.total >= 3 && stat.accuracy >= 80);
      }

      if (isUnlocked) {
        newUnlocked.push(ach);
        this.saveUnlockedAchievement(ach.id);
      }
    });

    return newUnlocked;
  },

  /**
   * 計算連續打卡天數（當前 streak）
   */
  calculateStreak(history) {
    if (!history || history.length === 0) return 0;

    // 取得所有有練習的日期（去重）
    const dates = [...new Set(
      history.map(h => new Date(h.timestamp).toISOString().split('T')[0])
    )].sort().reverse(); // 從最近開始

    if (dates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // 如果今天或昨天都沒有練習，streak 為 0
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((prev - curr) / 86400000);
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  /**
   * 取得活動日曆資料（每日作答題數）
   * 回傳最近 N 天的 { date: count } Map
   */
  getActivityCalendar(days = 90) {
    const history = storage.getAllHistory();
    const cal = {};

    // 初始化最近 N 天
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      cal[key] = 0;
    }

    history.forEach(h => {
      const key = new Date(h.timestamp).toISOString().split('T')[0];
      if (cal[key] !== undefined) cal[key]++;
    });

    return cal;
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
      // 同步到 Firestore
      this.syncAchievementsToFirestore(unlocked);
    }
  },

  /**
   * 同步成就到 Firestore
   */
  async syncAchievementsToFirestore(unlocked) {
    if (!window.currentUser) return;
    try {
      const uid = window.currentUser.uid;
      const ref = doc(db, `users/${uid}/profile`, 'achievements');
      await setDoc(ref, {
        unlocked: unlocked || this.getUnlockedAchievements(),
        lastUpdated: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('成就同步到 Firestore 失敗:', e);
    }
  },

  /**
   * 從 Firestore 拉取成就（登入時呼叫）
   */
  async syncAchievementsFromFirestore() {
    if (!window.currentUser) return;
    try {
      const uid = window.currentUser.uid;
      const ref = doc(db, `users/${uid}/profile`, 'achievements');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const remote = snap.data().unlocked || [];
        const local = this.getUnlockedAchievements();
        // 合併（取聯集）
        const merged = [...new Set([...local, ...remote])];
        localStorage.setItem(storage.KEY_ACHIEVEMENTS, JSON.stringify(merged));
        // 如果有新的，回寫 Firestore
        if (merged.length > remote.length) {
          await this.syncAchievementsToFirestore(merged);
        }
      }
    } catch (e) {
      console.warn('從 Firestore 拉取成就失敗:', e);
    }
  }
};
