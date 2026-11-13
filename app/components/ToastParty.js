'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, set, onValue, serverTimestamp } from 'firebase/database';
import { db } from '../lib/firebase';
import { playToastSound, unlockAudio } from '../lib/toastSound';

const CELEBRATION_MS = 3000; // 축하 애니메이션 시간 (3초)
const COOLDOWN_MS = 3000; // 버튼 연타 방지
const PARTICLE_COUNT = 36; // 흩뿌려지는 이모지 개수
const EMOJIS = ['🥂', '❄️', '🥂', '❄️', '✨'];

// 아래에서 위로 흩뿌려지는 이모지 하나하나의 움직임을 미리 정하기
function makeParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    emoji: EMOJIS[i % EMOJIS.length],
    startX: 50 + (Math.random() - 0.5) * 40, // 출발: 화면 아래쪽 가운데 근처 (vw)
    endX: (Math.random() - 0.5) * 90, // 좌우로 퍼지는 거리 (vw)
    peak: 45 + Math.random() * 45, // 얼마나 높이 올라가는지 (vh)
    rotate: (Math.random() - 0.5) * 720,
    size: 24 + Math.random() * 28,
    delay: Math.random() * 0.35,
    duration: 1.8 + Math.random() * 0.9,
  }));
}

// 3초 동안 보이는 건배 축하 화면
function Celebration({ by }) {
  const [particles] = useState(makeParticles);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      {/* 아래에서 위로 터지는 🥂 ❄️ */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute select-none"
          style={{ left: `${p.startX}vw`, bottom: '-60px', fontSize: p.size }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [`0vw`, `${p.endX * 0.6}vw`, `${p.endX}vw`],
            y: [`0vh`, `-${p.peak}vh`, `-${p.peak * 0.75}vh`],
            rotate: p.rotate,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        >
          {p.emoji}
        </motion.span>
      ))}

      {/* 화면 중앙: 큰 건배 잔 + 문구 (이모지보다 위에 보이게 나중에 그림) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-[120px] drop-shadow-[0_0_30px_rgba(253,230,138,0.8)]"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: [0, 1.4, 1], rotate: [-30, 10, 0] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          🥂
        </motion.div>
        <motion.p
          className="mt-2 rounded-full bg-slate-900/80 px-6 py-2 text-2xl font-bold text-amber-100 shadow-xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          건배! {by && <span className="text-amber-300">{by}</span>}
          {by && '님이 잔을 들었어요'}
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function ToastParty({ nickname, onToast }) {
  const [mounted, setMounted] = useState(false);
  const [event, setEvent] = useState(null); // 지금 보여 줄 건배 { id, by }
  const [coolingDown, setCoolingDown] = useState(false);
  const lastIdRef = useRef(null); // 마지막으로 축하한 건배 id (중복 방지)
  const hideTimerRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // 처음 클릭/키 입력 때 소리 장치를 깨워 두기 (다른 사람의 건배 소리도 들리도록)
  useEffect(() => {
    const wake = () => unlockAudio();
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    return () => {
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  // 소리 + 3초 애니메이션
  const celebrate = (id, by) => {
    if (lastIdRef.current === id) return; // 같은 건배는 한 번만
    lastIdRef.current = id;
    playToastSound();
    setEvent({ id, by });
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setEvent(null), CELEBRATION_MS);
  };

  // events/toast 실시간 구독 → 값이 바뀌면 모두의 화면에서 축하
  useEffect(() => {
    if (!db) return;
    let first = true;
    const unsubscribe = onValue(ref(db, 'events/toast'), (snap) => {
      const data = snap.val();
      if (first) {
        // 들어오기 전에 있었던 건배는 무시 (기준점만 기억)
        first = false;
        lastIdRef.current = data?.id ?? null;
        return;
      }
      if (data?.id) celebrate(data.id, data.by);
    });
    return () => {
      unsubscribe();
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleToast = () => {
    if (coolingDown) return;
    unlockAudio();
    onToast?.(); // 내 캐릭터도 잔을 번쩍!
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 내 화면은 바로 축하 (인터넷이 느려도 기다리지 않게)
    celebrate(id, nickname);

    // 모두에게 알리기: events/toast 에 현재 시간 기록
    if (db) {
      set(ref(db, 'events/toast'), {
        id,
        by: nickname,
        timestamp: serverTimestamp(),
      }).catch((err) => console.error('건배 전송 실패:', err));
    }

    setCoolingDown(true);
    setTimeout(() => setCoolingDown(false), COOLDOWN_MS);
  };

  return (
    <>
      {/* 화면 왼쪽 아래: 건배하기 버튼 */}
      <button
        type="button"
        onClick={handleToast}
        disabled={coolingDown}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-amber-200/40 bg-gradient-to-b from-amber-400 to-amber-500 px-6 py-3 text-lg font-bold text-slate-900 shadow-[0_0_25px_rgba(251,191,36,0.55)] transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        건배하기 🥂
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {event && <Celebration key={event.id} by={event.by} />}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
