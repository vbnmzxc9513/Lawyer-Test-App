import { auth } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

export const authService = {
  // 監聽登入狀態
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // 註冊
  async register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("註冊失敗:", error);
      return { success: false, error: error.message };
    }
  },

  // 登入
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("登入失敗:", error);
      return { success: false, error: error.message };
    }
  },

  // 登出
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("登出失敗:", error);
      return { success: false, error: error.message };
    }
  },

  // 取得當前使用者
  getCurrentUser() {
    return auth.currentUser;
  }
};
