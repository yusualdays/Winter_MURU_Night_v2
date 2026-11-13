'use client';

import { useEffect, useState } from 'react';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { db } from '../lib/firebase';
import { partyData } from '../data';
import { SPOTS } from '../lib/mapConfig';
import MapImage from './MapImage';
import PixelModal from './PixelModal';

const WISH_MAX = 80; // 소원 최대 글자 수

// 쪽지 색 (번갈아 사용)
const NOTE_COLORS = [
  '#fde68a',
  '#fbcfe8',
  '#bae6fd',
  '#d9f99d',
  '#fed7aa',
  '#ddd6fe',
];

// 트리 위에 쪽지가 매달리는 자리 (맵 전체 비율, 최신 소원부터 차례로)
const HANG_SLOTS = [
  { x: 0.055, y: 0.53 },
  { x: 0.035, y: 0.59 },
  { x: 0.08, y: 0.6 },
  { x: 0.025, y: 0.66 },
  { x: 0.065, y: 0.67 },
  { x: 0.105, y: 0.71 },
  { x: 0.015, y: 0.73 },
  { x: 0.05, y: 0.75 },
  { x: 0.09, y: 0.78 },
  { x: 0.03, y: 0.82 },
  { x: 0.07, y: 0.84 },
  { x: 0.115, y: 0.86 },
];

function formatDate(ts) {
  if (typeof ts !== 'number') return '방금 전';
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// 트리에 매달린 작은 쪽지 하나 (맵 위)
function HangingTag({ x, y, color, tilt }) {
  return (
    <div
      className="pointer-events-none absolute flex flex-col items-center"
      style={{ left: x - 12, top: y - 18, transform: `rotate(${tilt}deg)` }}
    >
      <span className="h-3 w-0.5 bg-[#7c5a3a]" /> {/* 끈 */}
      <span
        className="h-8 w-6 border-2 border-[#5b3b2a] shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]"
        style={{ backgroundColor: color }}
      >
        <span className="mx-auto mt-1.5 block h-0.5 w-3 bg-[#5b3b2a]/50" />
        <span className="mx-auto mt-1 block h-0.5 w-2 bg-[#5b3b2a]/50" />
      </span>
    </div>
  );
}

// 크리스마스 트리 소원 빌기
//  - 맵 위: (선택) 트리 그림 + 트리에 매달린 소원 쪽지들
//  - 모달: 나의 새해 소원 쓰기 + 모두의 소원 쪽지 목록 (Firebase "wishes")
export default function WishTree({ mapW, mapH, open, onClose, nickname }) {
  const [wishes, setWishes] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  // 모두의 소원을 실시간으로 구독 (트리에 쪽지를 매달기 위해 항상 구독)
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onValue(
      ref(db, 'wishes'),
      (snap) => {
        const list = [];
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)); // 최신순
        setWishes(list);
        setLoadError('');
      },
      (err) => {
        console.error(err);
        setLoadError(
          '소원을 불러오지 못했어요. Firebase 규칙을 확인해 주세요.'
        );
      }
    );
    return () => unsubscribe();
  }, []);

  // 창을 열 때마다 안내 문구 초기화
  useEffect(() => {
    if (open) setNotice({ type: '', text: '' });
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) {
      setNotice({ type: 'error', text: '소원을 적어 주세요 🙏' });
      return;
    }
    if (!db) {
      setNotice({
        type: 'error',
        text: 'Firebase 설정이 아직 안 되어 있어요 (lib/firebase.js)',
      });
      return;
    }
    setSaving(true);
    try {
      await push(ref(db, 'wishes'), {
        text: body.slice(0, WISH_MAX),
        nickname: anonymous ? '익명' : nickname || '손님',
        createdAt: serverTimestamp(),
      });
      setText('');
      setNotice({ type: 'ok', text: '트리에 소원을 매달았어요! 🎄✨' });
    } catch (err) {
      console.error(err);
      setNotice({
        type: 'error',
        text: '저장하지 못했어요. Firebase 규칙을 확인해 주세요.',
      });
    } finally {
      setSaving(false);
    }
  };

  const tree = SPOTS.tree;

  return (
    <>
      {/* (선택) 트리 그림: data.js에 treeImage를 넣으면 배경 위에 그려져요 */}
      {partyData?.treeImage && (
        <MapImage
          src={partyData.treeImage}
          alt="크리스마스 트리"
          x={tree.x * mapW}
          y={tree.y * mapH}
          width={tree.w * mapW}
          height={tree.h * mapH}
        />
      )}

      {/* 트리에 매달린 소원 쪽지 (최신 12개) */}
      {wishes.slice(0, HANG_SLOTS.length).map((wish, i) => (
        <HangingTag
          key={wish.id}
          x={HANG_SLOTS[i].x * mapW}
          y={HANG_SLOTS[i].y * mapH}
          color={NOTE_COLORS[i % NOTE_COLORS.length]}
          tilt={i % 2 === 0 ? -8 : 8}
        />
      ))}

      {/* 소원 빌기 창 */}
      <PixelModal
        open={open}
        onClose={onClose}
        label="🎄 소원 트리"
        title="새해 소원을 적어보세요🙏"
        width={560}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={WISH_MAX}
            rows={3}
            placeholder="예: 내년에는 매일 30분씩 산책하기!"
            className="w-full resize-none border-4 border-[#1a110e] bg-[#fdf6e3] p-3 text-[#2b1d1a] outline-none placeholder:text-[#2b1d1a]/40 focus:border-amber-400"
          />
          <div className="flex items-center justify-between gap-2 text-xs text-white/70">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="accent-amber-400"
              />
              이름 숨기기 (익명)
            </label>
            <span className="tabular-nums">
              {text.length}/{WISH_MAX}
            </span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="border-4 border-[#1a110e] bg-amber-400 py-2 font-black text-[#2b1d1a] shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] transition hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            {saving ? '매다는 중...' : '트리에 소원 매달기 🎄'}
          </button>
          {notice.text && (
            <p
              className={`text-center text-sm ${
                notice.type === 'ok' ? 'text-lime-300' : 'text-rose-300'
              }`}
            >
              {notice.text}
            </p>
          )}
        </form>

        {/* 모두의 소원 쪽지 */}
        <div className="mt-5 border-t-4 border-dashed border-white/15 pt-4">
          <p className="mb-3 text-sm font-bold text-amber-200">
            ✨ 트리에 매달린 소원 {wishes.length}개
          </p>
          {loadError && <p className="text-sm text-rose-300">{loadError}</p>}
          {!loadError && wishes.length === 0 && (
            <p className="py-4 text-center text-sm text-white/50">
              첫 번째 소원을 매달아 주세요!
            </p>
          )}
          <ul className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2">
            {wishes.map((wish, i) => (
              <li
                key={wish.id}
                className="flex flex-col items-center"
                style={{ transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)` }}
              >
                <span className="h-3 w-0.5 bg-amber-200/70" /> {/* 끈 */}
                <div
                  className="w-full border-4 border-[#1a110e] p-3 text-[#2b1d1a] shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]"
                  style={{
                    backgroundColor: NOTE_COLORS[i % NOTE_COLORS.length],
                  }}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {wish.text}
                  </p>
                  <p className="mt-2 text-right text-[11px] font-bold text-[#2b1d1a]/60">
                    – {wish.nickname} · {formatDate(wish.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </PixelModal>
    </>
  );
}
