'use client';

import { useEffect, useRef, useState } from 'react';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { db } from '../lib/firebase';

const KEEP = 50; // 불러올 최근 메시지 수

// 닉네임마다 고정된 색 (같은 사람은 항상 같은 색)
const NAME_COLORS = [
  '#fca5a5',
  '#fdba74',
  '#fde047',
  '#86efac',
  '#67e8f9',
  '#93c5fd',
  '#c4b5fd',
  '#f9a8d4',
];
const nameColor = (name = '') => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
};

// 오른쪽 아래 반투명 채팅 기록 (Firebase "chat")
//  - 말풍선으로 보낸 메시지가 여기에도 차곡차곡 쌓여요
//  - [💬 말하기] 버튼 또는 Enter → 화면 하단 가운데 입력창이 열려요 (onOpenInput)
//  - lifted: 유튜브 미니 플레이어가 떠 있으면 그 위로 올라가요
export default function ChatBox({ nickname, lifted = false, onOpenInput }) {
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false); // 처음에는 채팅 기록을 접어 둬요 ([채팅 기록 펴기]로 열기)
  const [error, setError] = useState('');
  const listRef = useRef(null);

  // 최근 메시지 실시간 구독
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onValue(
      query(ref(db, 'chat'), limitToLast(KEEP)),
      (snap) => {
        const list = [];
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        list.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)); // 오래된 것 → 최신 (아래)
        setMessages(list.slice(-KEEP));
        setError('');
      },
      (err) => {
        console.error(err);
        setError('채팅을 불러오지 못했어요. Firebase 규칙을 확인해 주세요.');
      }
    );
    return () => unsubscribe();
  }, []);

  // 새 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  return (
    <div
      className="pointer-events-none fixed right-4 z-30 flex w-80 max-w-[calc(100vw-2rem)] flex-col items-stretch transition-[bottom] duration-300 [&>*]:pointer-events-auto"
      style={{ bottom: lifted ? 272 : 16 }}
    >
      {/* 접기/펴기 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-1.5 self-end rounded-md bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white/80 backdrop-blur-sm hover:bg-black/60"
      >
        채팅 기록 {open ? '접기 ▾' : '펴기 ▴'}
      </button>

      {open && (
        <>
          {/* 메시지 목록 (위쪽은 스르륵 흐려져요) */}
          <div
            ref={listRef}
            className="chat-scroll flex max-h-60 flex-col gap-1.5 overflow-y-auto pr-1"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent 0, black 40px)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0, black 40px)',
            }}
          >
            <style>{`.chat-scroll::-webkit-scrollbar{width:4px}.chat-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25);border-radius:4px}`}</style>
            {messages.length === 0 && !error && (
              <p className="rounded-lg bg-black/45 px-3 py-2 text-xs text-white/60 backdrop-blur-sm">
                Enter를 눌러 첫 인사를 남겨 보세요! 👋
              </p>
            )}
            {messages.map((m) => {
              const mine = m.nickname === nickname;
              return (
                <div
                  key={m.id}
                  className={`rounded-lg px-3 py-1.5 backdrop-blur-sm ${
                    mine
                      ? 'bg-amber-900/55 ring-1 ring-amber-300/40'
                      : 'bg-black/50'
                  }`}
                >
                  <p
                    className="text-xs font-bold"
                    style={{ color: nameColor(m.nickname) }}
                  >
                    {m.nickname}
                    {mine && (
                      <span className="ml-1 text-[10px] text-amber-200/80">
                        (나)
                      </span>
                    )}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-snug text-white">
                    {m.text}
                  </p>
                </div>
              );
            })}
          </div>

          {error && (
            <p className="mt-1 rounded-md bg-rose-900/70 px-2 py-1 text-[11px] text-rose-100">
              {error}
            </p>
          )}
        </>
      )}

      {/* 💬 말풍선 버튼 → 하단 가운데 입력창 열기 */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()} // 버튼이 포커스를 가져가지 않게 (입력창이 바로 열리도록)
        onClick={onOpenInput}
        aria-label="말풍선 채팅하기 (Enter)"
        title="말풍선 채팅하기 (Enter)"
        className="mt-2 flex items-center gap-1.5 self-end border-4 border-[#1a110e] bg-[#f5e6c8] px-3 py-1.5 text-sm font-black text-[#2b1d1a] shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] transition hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        💬 말하기{' '}
        <span className="bg-[#2b1d1a] px-1 text-[10px] text-amber-200">
          Enter
        </span>
      </button>
    </div>
  );
}
