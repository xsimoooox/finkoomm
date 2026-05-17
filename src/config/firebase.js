// ============================================================
// Firebase configuration — replace with your own credentials
// ============================================================
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDWVNNE_7-Ea1Cd5mPUZuh3pDGlEG64DGM",
  authDomain: "sign-langage.firebaseapp.com",
  projectId: "sign-langage",
  storageBucket: "sign-langage.firebasestorage.app",
  messagingSenderId: "370288669203",
  appId: "1:370288669203:web:e83b64f009ad70411885e6",
  measurementId: "G-51DXRT40ML",
  databaseURL: "https://sign-langage-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export default app;
