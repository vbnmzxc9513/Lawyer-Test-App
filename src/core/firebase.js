import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// 這裡使用假的設定檔，因為我們目前使用 Firebase Local Emulator
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firestore
const db = getFirestore(app);

// 連接到本地 Emulator (開發環境)
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  console.log("🔥 Connected to Firestore Local Emulator");
}

export { app, db };
