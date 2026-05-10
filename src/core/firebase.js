import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDKvplWENIDpdmhLmEm72rhrfDwikYhkXM",
  authDomain: "lawyerexam.firebaseapp.com",
  projectId: "lawyerexam",
  storageBucket: "lawyerexam.firebasestorage.app",
  messagingSenderId: "1025446959678",
  appId: "1:1025446959678:web:270460dbba5e40ec22cf6f",
  measurementId: "G-440REVJBRX"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firestore
const db = getFirestore(app);

// 初始化 Auth
const auth = getAuth(app);

export { app, db, auth };
