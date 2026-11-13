'use client';

import { useEffect, useState } from 'react';
import {
  ref,
  push,
  onValue,
  query,
  limitToLast,
  serverTimestamp,
} from 'firebase/database';
import { db } from '../lib/firebase';
import { getNickname } from '../lib/session';

// 친구 추천 (올해의 영화 / 올해의 책) 공용 부품
//  - Firebase 경로: "partyMovies" 또는 "partyBooks"
//  - 저장 모양: { nickname, title, creator(감독/지은이, 선택), comment, color, createdAt }

const TITLE_MAX = 30;
const CREATOR_MAX = 20;
const COMMENT_MAX = 60;
const KEEP = 60; // 불러올 최근 추천 수

// 포스터/표지 테마 색 5가지
export const PICK_COLORS = [
  { id: 'red', name: '빨강', hex: '#b91c1c' },
  { id: 'blue', name: '파랑', hex: '#1d4ed8' },
  { id: 'green', name: '초록', hex: '#15803d' },
  { id: 'gold', name: '황금', hex: '#a16207' },
  { id: 'purple', name: '보라', hex: '#7e22ce' },
];

// 친구 추천 목록을 실시간으로 받아오기 (창이 열려 있을 때만)
export function useFriendPicks(path, open) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !db) return;
    const unsubscribe = onValue(
      query(ref(db, path), limitToLast(KEEP)),
      (snap) => {
        const list = [];
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        list.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)); // 먼저 추천한 순서대로
        setItems(list);
        setError('');
      },
      (err) => {
        console.error(err);
        setError(
          '추천 목록을 불러오지 못했어요. Firebase 규칙을 확인해 주세요.'
        );
      }
    );
    return () => unsubscribe();
  }, [path, open]);

  return { items, error };
}

// [+ 나도 추천하기] 등록 폼
//  - kind: "영화" 또는 "책" (안내 문구에 쓰여요)
export function RecommendForm({ path, kind, onDone }) {
  const nickname = getNickname() || '손님';
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [comment, setComment] = useState('');
  const [color, setColor] = useState(PICK_COLORS[0].hex);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) {
      setError(`${kind} 제목과 한줄 감상평을 모두 적어 주세요`);
      return;
    }
    if (!db) {
      setError('Firebase 설정이 아직 안 되어 있어요 (lib/firebase.js)');
      return;
    }
    setSaving(true);
    try {
      await push(ref(db, path), {
        nickname,
        title: title.trim().slice(0, TITLE_MAX),
        creator: creator.trim().slice(0, CREATOR_MAX),
        comment: comment.trim().slice(0, COMMENT_MAX),
        color,
        createdAt: serverTimestamp(),
      });
      onDone?.();
    } catch (err) {
      console.error(err);
      setError('저장하지 못했어요. Firebase 규칙을 확인해 주세요.');
      setSaving(false);
    }
  };

  const inputClass =
    'w-full border-4 border-[#1a110e] bg-[#fdf6e3] px-3 py-2 text-sm text-[#2b1d1a] outline-none placeholder:text-[#2b1d1a]/40 focus:border-amber-400';

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-col gap-2 border-4 border-dashed border-amber-200/40 bg-black/20 p-3"
    >
      <p className="text-xs text-white/70">
        추천하는 사람:{' '}
        <span className="font-bold text-amber-200">{nickname}</span>
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={TITLE_MAX}
        placeholder={`${kind} 제목`}
        autoFocus
        aria-label={`${kind} 제목`}
        className={inputClass}
      />
      <input
        value={creator}
        onChange={(e) => setCreator(e.target.value)}
        maxLength={CREATOR_MAX}
        placeholder={
          kind === '영화' ? '감독 이름 (안 써도 돼요)' : '지은이 (안 써도 돼요)'
        }
        aria-label={kind === '영화' ? '감독 이름' : '지은이'}
        className={inputClass}
      />

      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={COMMENT_MAX}
        placeholder="한줄 감상평 (예: 보고 나서 하루 종일 생각났어요)"
        aria-label="한줄 감상평"
        className={inputClass}
      />
      {/* 테마 색상 5가지 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/70">
          {kind === '영화' ? '포스터' : '표지'} 색
        </span>
        {PICK_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setColor(c.hex)}
            aria-label={`${c.name}색`}
            aria-pressed={color === c.hex}
            title={c.name}
            className={`h-7 w-7 border-[3px] transition ${
              color === c.hex
                ? 'scale-110 border-amber-300'
                : 'border-[#1a110e] hover:scale-105'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 border-4 border-[#1a110e] bg-amber-400 py-1.5 font-black text-[#2b1d1a] shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] hover:bg-amber-300 disabled:opacity-50"
        >
          {saving ? '등록 중...' : '등록하기'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="border-4 border-[#1a110e] bg-[#6e4833] px-3 py-1.5 text-sm font-black text-amber-100 hover:bg-[#7d5440]"
        >
          취소
        </button>
      </div>
    </form>
  );
}

// "친구들의 추천" 제목 줄 + [+ 나도 추천하기] 버튼
export function FriendHeader({ count, formOpen, onToggle }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-2 border-t-4 border-dashed border-white/15 pt-4">
      <p className="text-sm font-bold text-amber-200">
        👥 친구들의 추천 {count}개
      </p>
      {!formOpen && (
        <button
          type="button"
          onClick={onToggle}
          className="border-4 border-[#1a110e] bg-[#f5e6c8] px-3 py-1 text-sm font-black text-[#2b1d1a] shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] hover:bg-white"
        >
          + 나도 추천하기
        </button>
      )}
    </div>
  );
}
