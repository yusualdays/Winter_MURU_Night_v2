'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { db } from '../lib/firebase';
import { toKey } from '../lib/session';
import Hotspot from './Hotspot';

const MESSAGE_MAX = 200;

export default function SnowmanMailbox({ x, y, width, height, nickname }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState([]); // 지금 접속 중인 친구 닉네임 목록
  const [to, setTo] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => setMounted(true), []);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // 모달이 열려 있는 동안 접속자 목록(users) 구독
  useEffect(() => {
    if (!open || !db) return;
    const me = nickname;
    const unsubscribe = onValue(ref(db, 'users'), (snap) => {
      const names = new Set();
      snap.forEach((child) => {
        const name = child.val()?.nickname;
        if (name && name !== me) names.add(name); // 나는 빼고, 같은 닉네임은 한 번만
      });
      setFriends([...names].sort((a, b) => a.localeCompare(b, 'ko')));
    });
    return () => unsubscribe();
  }, [open, nickname]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!to)
      return setNotice({ type: 'error', text: '받는 사람을 골라 주세요.' });
    if (!text) return setNotice({ type: 'error', text: '덕담을 적어 주세요.' });
    if (!db)
      return setNotice({
        type: 'error',
        text: 'Firebase 설정이 아직 안 됐어요.',
      });

    setSending(true);
    setNotice({ type: '', text: '' });
    try {
      // 익명이라 보낸 사람 정보는 저장하지 않아요
      await Promise.race([
        push(ref(db, `messages/${toKey(to)}`), {
          content: text,
          timestamp: serverTimestamp(),
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 10000)
        ),
      ]);
      setContent('');
      setNotice({ type: 'ok', text: `💌 ${to}님에게 덕담을 보냈어요!` });
    } catch (err) {
      console.error(err);
      setNotice({
        type: 'error',
        text: '보내지 못했어요. Firebase 설정과 규칙을 확인해 주세요.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* 크리스마스 트리 = 눈사람 우체통 (트리 아래에 작은 눈사람 우체통이 서 있어요) */}
      <Hotspot
        x={x}
        y={y}
        width={width}
        height={height}
        label="📮 눈사람 우체통"
        rounded="rounded-3xl"
        onClick={() => {
          setNotice({ type: '', text: '' });
          setOpen(true);
        }}
      >
        <svg
          viewBox="0 0 100 120"
          className="pointer-events-none absolute bottom-[24%] right-[2%] w-[48%] drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)] transition group-hover:scale-110"
        >
          {/* 몸통 + 빨간 우체통 */}
          <circle
            cx="50"
            cy="86"
            r="30"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          <rect
            x="30"
            y="72"
            width="40"
            height="30"
            rx="6"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="2"
          />
          <rect x="37" y="79" width="26" height="4" rx="2" fill="#450a0a" />
          <text
            x="50"
            y="97"
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#fef3c7"
          >
            POST
          </text>
          <g>
            <rect
              x="40"
              y="64"
              width="20"
              height="14"
              rx="1.5"
              fill="#fffbeb"
              stroke="#d97706"
              strokeWidth="1.2"
            />
            <path
              d="M40 64 L50 72 L60 64"
              fill="none"
              stroke="#d97706"
              strokeWidth="1.2"
            />
          </g>
          {/* 머리 + 우체부 모자 */}
          <circle
            cx="50"
            cy="40"
            r="20"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          <circle cx="43" cy="37" r="2.4" fill="#1e293b" />
          <circle cx="57" cy="37" r="2.4" fill="#1e293b" />
          <circle cx="39" cy="44" r="3" fill="#fda4af" opacity="0.7" />
          <circle cx="61" cy="44" r="3" fill="#fda4af" opacity="0.7" />
          <path d="M50 41 L60 43 L50 45 Z" fill="#f97316" />
          <path
            d="M44 49 Q50 53 56 49"
            stroke="#1e293b"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="31" y="20" width="38" height="9" rx="3" fill="#1d4ed8" />
          <rect x="35" y="10" width="30" height="13" rx="4" fill="#2563eb" />
          <circle cx="50" cy="16" r="3" fill="#facc15" />
        </svg>
      </Hotspot>

      {/* 덕담 남기기 모달 */}
      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <form
              onSubmit={handleSend}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-slate-800 p-5 text-white shadow-2xl ring-1 ring-white/10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-amber-300">
                    📮 눈사람 우체통 · 익명
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    친구에게 덕담 남기기
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

              <label className="text-sm text-slate-300">
                받는 사람
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-900 px-3 py-2.5 text-white outline-none ring-1 ring-slate-600 focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">
                    {friends.length
                      ? '누구에게 보낼까요?'
                      : '지금 접속한 친구가 없어요'}
                  </option>
                  {friends.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-300">
                덕담
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={MESSAGE_MAX}
                  rows={4}
                  placeholder="내년에도 건강하고 행복하길! ☃️"
                  className="mt-1 w-full resize-none rounded-lg bg-slate-900 px-3 py-2.5 text-white placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-2 focus:ring-amber-400"
                />
                <span className="block text-right text-xs text-slate-500">
                  {content.length}/{MESSAGE_MAX}
                </span>
              </label>

              <p className="text-xs text-slate-400">
                보낸 사람 이름은 남지 않아요. 익명으로 전달돼요.
              </p>

              {notice.text && (
                <p
                  className={`text-sm ${
                    notice.type === 'ok' ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {notice.text}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-amber-400 py-3 font-bold text-slate-900 transition hover:bg-amber-300 disabled:opacity-60"
              >
                {sending ? '보내는 중...' : '우체통에 넣기'}
              </button>
            </form>
          </div>,
          document.body
        )}
    </>
  );
}
