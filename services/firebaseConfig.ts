// ============================================================
// CONFIGURAÇÃO FIREBASE - TexFlow
// ============================================================
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAIa7BzSXDCgOR8v0CxamPmtXt5ILaKZiA",
  authDomain: "texflow-3687d.firebaseapp.com",
  projectId: "texflow-3687d",
  storageBucket: "texflow-3687d.firebasestorage.app",
  messagingSenderId: "1038929062217",
  appId: "1:1038929062217:web:c02b8d1f2d08dd12fe1298"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
