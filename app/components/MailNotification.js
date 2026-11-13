'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { toKey } from '../lib/session';

const CARD_COLORS = [
  'bg-sky-100',
  'bg-rose-100',
  'bg-amber-100',
  'bg-emerald-100',
  'bg-violet-100',
];

function formatDate(ts) {
  if (typeof ts !== 'number') return '방금 전';
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(
    d.getHours()
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function MailNotification({ nickname }) {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [lastRead, setLastRead] = useState(0); // 마지막으로 읽은 시각
  const [openedAt, setOpenedAt] = useState(0); // 목록을 열 때의 lastRead (NEW 표시용)
  const [open, setOpen] = useState(false);
  const storageKey = `partyLastRead:${nickname}`;

  useEffect(() => setMounted(true), []);

  // 이 브라우저에서 마지막으로 읽은 시각 불러오기
  useEffect(() => {
    try {
      setLastRead(Number(localStorage.getItem(storageKey)) || 0);
    } catch {}
  }, [storageKey]);

  // 내게 온 메시지 실시간 구독: messages/{내 닉네임}
  useEffect(() => {
    if (!db || !nickname) return;
    const unsubscribe = onValue(
      ref(db, `messages/${toKey(nickname)}`),
      (snap) => {
        const list = [];
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        list.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)); // 최신순
        setMessages(list);
      }
    );
    return () => unsubscribe();
  }, [nickname]);

  // 목록을 보고 있으면 모두 읽음 처리
  useEffect(() => {
    if (!open || messages.length === 0) return;
    const newest = Math.max(...messages.map((m) => m.timestamp ?? 0));
    if (newest > lastRead) {
      setLastRead(newest);
      try {
        localStorage.setItem(storageKey, String(newest));
      } catch {}
    }
  }, [open, messages, lastRead, storageKey]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!db) return null;

  const unread = messages.filter((m) => (m.timestamp ?? 0) > lastRead).length;

  return (
    <>
      <style>{`
        @keyframes flake-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .flake-spin { animation: flake-spin 4s linear infinite; }
      `}</style>

      {/* 화면 오른쪽 위 눈송이 알림 */}
      <button
        type="button"
        onClick={() => {
          setOpenedAt(lastRead);
          setOpen(true);
        }}
        aria-label={unread ? `새 덕담 ${unread}개` : '받은 롤링페이퍼 보기'}
        title={unread ? `새 덕담 ${unread}개` : '받은 롤링페이퍼 보기'}
        className={`fixed right-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-900/70 text-2xl shadow-lg backdrop-blur transition hover:scale-110 ${
          unread
            ? 'ring-2 ring-sky-300 shadow-[0_0_20px_rgba(125,211,252,0.7)]'
            : 'opacity-70'
        }`}
      >
        <span className={unread ? 'flake-spin' : ''}>❄️</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* 받은 롤링페이퍼 목록 */}
      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <div
              className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-slate-800 p-5 text-white shadow-2xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs text-sky-300">❄️ 받은 롤링페이퍼</p>
                  <h2 className="mt-1 text-xl font-bold">
                    {nickname}님에게 온 덕담
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-2 text-2xl leading-none text-slate-400 hover:text-white"
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>

              <div className="-mx-1 overflow-y-auto px-1 py-1">
                {messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    아직 도착한 덕담이 없어요. 곧 눈송이처럼 날아올 거예요 ☃️
                  </p>
                ) : (
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {messages.map((m, i) => (
                      <li
                        key={m.id}
                        className={`${
                          CARD_COLORS[i % CARD_COLORS.length]
                        } relative rounded-xl p-4 text-slate-800 shadow`}
                      >
                        {(m.timestamp ?? 0) > openedAt && (
                          <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            NEW
                          </span>
                        )}
                        <p className="whitespace-pre-wrap break-words pr-8 text-sm leading-relaxed">
                          {m.content}
                        </p>
                        <p className="mt-3 text-right text-xs text-slate-500">
                          익명의 친구 · {formatDate(m.timestamp)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
