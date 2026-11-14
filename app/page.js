'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CharacterCustomizer from './components/CharacterCustomizer';
import { DEFAULT_LOOK, normalizeLook } from './lib/pixelCharacter';
import { getLook, saveLook } from './lib/session';
import { playDoorbell } from './lib/doorbell';
import LoadingScreen from './components/LoadingScreen';

export default function EntranceGate() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [look, setLook] = useState(DEFAULT_LOOK);
  const [error, setError] = useState('');
  const [entering, setEntering] = useState(false); // 거실로 들어가는 중 (로딩 화면)

  // 거실 화면을 미리 준비해 두기 → 입장할 때 더 빨리 열려요
  useEffect(() => {
    router.prefetch('/living-room');
  }, [router]);
  const inputRef = useRef(null);

  // 예전에 꾸민 캐릭터·닉네임이 있으면 불러오기
  useEffect(() => {
    const saved = getLook();
    if (saved) setLook(normalizeLook(saved));
    try {
      setNickname(localStorage.getItem('partyNickname') || '');
    } catch {}
  }, []);

  useEffect(() => {
    if (isModalOpen) inputRef.current?.focus();
  }, [isModalOpen]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setIsModalOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = nickname.trim();
    if (!name) return setError('닉네임을 입력해 주세요.');
    if (name.length > 12)
      return setError('닉네임은 12자 이내로 입력해 주세요.');
    try {
      localStorage.setItem('partyNickname', name);
    } catch {}
    saveLook(look); // 거실에 들어가면 Firebase 접속자 정보에도 함께 저장돼요
    setEntering(true); // 거실이 열릴 때까지 로딩 화면
    router.push('/living-room');
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center px-4">
      <style>{`
        @keyframes snow {
          from { transform: translateY(-10vh); }
          to   { transform: translateY(110vh); }
        }
      `}</style>
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="pointer-events-none absolute top-0 rounded-full bg-white"
          style={{
            left: `${(i * 37) % 100}%`,
            width: `${2 + (i % 4)}px`,
            height: `${2 + (i % 4)}px`,
            opacity: 0.3 + (i % 5) * 0.12,
            animation: `snow ${8 + (i % 7)}s linear ${-(i % 10)}s infinite`,
          }}
        />
      ))}

      <div className="absolute top-12 right-12 h-20 w-20 rounded-full bg-amber-100 shadow-[0_0_60px_20px_rgba(254,243,199,0.25)]" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-6 text-6xl">🚪</div>
        <h1 className="mb-2 text-3xl font-bold text-white">
          겨울이 무르익는 밤
        </h1>
        <p className="mb-10 text-slate-300">
          따뜻한 집 안에서 친구들이 기다리고 있어요
        </p>
        <button
          onClick={() => {
            playDoorbell(); // 딩~동~
            setError('');
            setIsModalOpen(true);
          }}
          className="rounded-full bg-amber-400 px-10 py-4 text-lg font-bold text-slate-900 shadow-[0_0_30px_rgba(251,191,36,0.5)] transition hover:scale-105 hover:bg-amber-300 active:scale-95"
        >
          🔔 초인종 누르기
        </button>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-slate-800 p-5 shadow-2xl ring-1 ring-white/10"
          >
            <p className="mb-1 text-xl"> </p>
            <label htmlFor="nickname" className="mb-2 block text-slate-200">
              😊 닉네임을 입력해 주세요
            </label>
            <input
              id="nickname"
              ref={inputRef}
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              placeholder="예: 눈사람"
              maxLength={20}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-2 focus:ring-amber-400"
            />
            {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

            {/* 캐릭터 꾸미기 */}
            <h2 className="mb-3 mt-6 text-lg  text-white">
              🧑‍🎄 내 캐릭터 꾸미기
            </h2>
            <CharacterCustomizer look={look} onChange={setLook} />

            <div className="sticky bottom-0 mt-6 flex gap-2 bg-slate-800 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-lg bg-slate-700 py-3 text-slate-200 transition hover:bg-slate-600"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-[2] rounded-lg bg-amber-400 py-3 font-bold text-slate-900 transition hover:bg-amber-300"
              >
                이 모습으로 입장하기
              </button>
            </div>
          </form>
        </div>
      )}
      {/* 거실로 넘어가는 동안 로딩 화면 */}
      {entering && <LoadingScreen />}
    </main>
  );
}
