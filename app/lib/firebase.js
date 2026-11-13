import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ⬇️ Firebase 콘솔에서 복사한 내 값으로 교체하세요
const firebaseConfig = {
  apiKey: 'AIzaSyCRmZ0LSLXsmBgI8QAfhZB1O-UjJGvP6rw',
  authDomain: 'winter-party-81c81.firebaseapp.com',
  databaseURL:
    'https://winter-party-81c81-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'winter-party-81c81',
  storageBucket: 'winter-party-81c81.firebasestorage.app',
  messagingSenderId: '1055883361035',
  appId: '1:1055883361035:web:eed7c3e7c1b8808d47800e',
  measurementId: 'G-9DVKNSNPN2',
};

// 아직 예시 값 그대로면 "설정 안 됨"으로 처리
const isConfigured = !Object.values(firebaseConfig).some(
  (v) => v.includes('내프로젝트') || v.includes('여기에') || v.includes('숫자')
);

// 설정이 잘못돼도 화면 전체가 멈추지 않도록 try로 감싸기
let db = null;
if (isConfigured)
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (err) {
    console.error('Firebase 설정을 확인해 주세요:', err);
  }

export { db };
