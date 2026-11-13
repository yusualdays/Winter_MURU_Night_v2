'use client';

import { useEffect, useRef, useState } from 'react';
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
import { partyData } from '../data';
import { SPOTS, GUEST_NOTE_SLOTS } from '../lib/mapConfig';
import MapImage from './MapImage';
import PixelModal from './PixelModal';

const MAX_LEN = 120; // 방명록 최대 글자 수
const KEEP = 100; // 불러올 최근 방명록 수

// 카드 색 (번갈아 사용)
const CARD_COLORS = ['#fdf6e3', '#fde68a', '#fbcfe8', '#bae6fd', '#d9f99d'];

function formatDate(ts) {
  if (typeof ts !== 'number') return '방금 전';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`;
}

// 벽에 붙은 작은 방명록 메모지 (맵 위) — 압정으로 꽂은 느낌
function WallNote({ x, y, color, tilt }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: x - 14, top: y - 14, transform: `rotate(${tilt}deg)` }}
    >
      <span
        className="relative block h-7 w-7 border-2 border-[#5b3b2a] shadow-[2px_3px_0_0_rgba(0,0,0,0.25)]"
        style={{ backgroundColor: color }}
      >
        <span className="absolute -top-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-[#7f1d1d] bg-[#ef4444]" />{' '}
        {/* 압정 */}
        <span className="mx-auto mt-2.5 block h-0.5 w-4 bg-[#5b3b2a]/50" />
        <span className="mx-auto mt-1 block h-0.5 w-3 bg-[#5b3b2a]/50" />
      </span>
    </div>
  );
}
// 벽에 걸린 도트 방명록 액자 (그림이 없을 때 코드로 그려요)
function PixelFrame() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-[6px] border-[#3b2a20] bg-[#fdf6e3] p-2 shadow-[4px_6px_0_0_rgba(0,0,0,0.25)]">
      <span className="text-3xl leading-none">✍️</span>
      {/* 서명처럼 보이는 줄 */}
      <span className="h-1.5 w-4/5 bg-[#5b3b2a]/60" />
      <span className="h-1.5 w-3/5 bg-[#5b3b2a]/60" />
      <span className="h-1.5 w-2/3 bg-[#5b3b2a]/60" />
      <span className="mt-1 bg-[#3b2a20] px-2 py-0.5 text-[13px] font-black text-amber-200">
        방명록
      </span>
    </div>
  );
}

// 포스터와 책꽂이 사이 "방명록" 액자 + 방명록 창 (Firebase "guestbook")
export default function QuoteWall({ mapW, mapH, open, onClose }) {
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [loadError, setLoadError] = useState('');
  const nickname = useRef('');
  const s = SPOTS.quote ?? { x: 0.528, y: 0.035, w: 0.1, h: 0.135 };

  // 창을 열 때: 내 닉네임 불러오고 안내 문구 초기화
  useEffect(() => {
    if (!open) return;
    nickname.current = getNickname() || '손님';
    setNotice({ type: '', text: '' });
  }, [open]);
  // 방명록 실시간 구독 (창이 열려 있을 때만)
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onValue(
      query(ref(db, 'guestbook'), limitToLast(KEEP)),
      (snap) => {
        const list = [];
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)); // 최신순
        setEntries(list);
        setLoadError('');
      },
      (err) => {
        console.error(err);
        setLoadError(
          '방명록을 불러오지 못했어요. Firebase 규칙을 확인해 주세요.'
        );
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) {
      setNotice({ type: 'error', text: '한 마디 남겨 주세요 ✍️' });
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
      await push(ref(db, 'guestbook'), {
        nickname: nickname.current || '손님',
        text: body.slice(0, MAX_LEN),
        createdAt: serverTimestamp(),
      });
      setText('');
      setNotice({ type: 'ok', text: '방명록에 이름을 남겼어요! 🎉' });
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

  return (
    <>
      {/* 벽의 액자 (data.js에 quoteFrameImage를 넣으면 그 그림으로 바뀌어요) */}
      <MapImage
        src={partyData?.quoteFrameImage}
        alt="방명록 액자"
        x={s.x * mapW}
        y={s.y * mapH}
        width={s.w * mapW}
        height={s.h * mapH}
        fallback={<PixelFrame />}
      />

      {/* 액자 둘레에 붙은 방명록 메모지 (최신 글부터) */}
      {entries.slice(0, GUEST_NOTE_SLOTS.length).map((en, i) => (
        <WallNote
          key={en.id}
          x={GUEST_NOTE_SLOTS[i].x * mapW}
          y={GUEST_NOTE_SLOTS[i].y * mapH}
          color={CARD_COLORS[(i % (CARD_COLORS.length - 1)) + 1]}
          tilt={i % 2 === 0 ? -7 : 6}
        />
      ))}

      {/* 방명록 창 */}
      <PixelModal
        open={open}
        onClose={onClose}
        label="✍️ 방명록"
        title="흔적을 남겨 주세요"
        width={560}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_LEN}
            rows={3}
            placeholder="예: 초대해 줘서 고마워! 올해도 수고 많았어 🎄"
            className="w-full resize-none border-4 border-[#1a110e] bg-[#fdf6e3] p-3 text-[#2b1d1a] outline-none placeholder:text-[#2b1d1a]/40 focus:border-amber-400"
          />
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>이름은 입장할 때 쓴 닉네임으로 남아요</span>
            <span className="tabular-nums">
              {text.length}/{MAX_LEN}
            </span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="border-4 border-[#1a110e] bg-amber-400 py-2 font-black text-[#2b1d1a] shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] transition hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            {saving ? '남기는 중...' : '방명록 남기기 ✍️'}
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

        {/* 모두의 방명록 */}
        <div className="mt-5 border-t-4 border-dashed border-white/15 pt-4">
          <p className="mb-3 text-sm font-bold text-amber-200">
            📖 다녀간 사람들 {entries.length}명
          </p>
          {loadError && <p className="text-sm text-rose-300">{loadError}</p>}
          {!loadError && entries.length === 0 && (
            <p className="py-4 text-center text-sm text-white/50">
              첫 번째 방명록을 남겨 주세요!
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {entries.map((en, i) => (
              <li
                key={en.id}
                className="border-4 border-[#1a110e] p-3 text-[#2b1d1a] shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]"
                style={{ backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-black">{en.nickname}</p>
                  <p className="shrink-0 text-[11px] text-[#2b1d1a]/50">
                    {formatDate(en.createdAt)}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {en.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </PixelModal>
    </>
  );
}
