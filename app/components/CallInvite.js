'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { toKey } from '../lib/session';
import { partyData } from '../data';
import { SPOTS } from '../lib/mapConfig';
import MapImage from './MapImage';
import PixelModal from './PixelModal';

// http(s) 주소만 허용 (이상한 주소가 들어가도 안전하게)
const safeUrl = (url = '') =>
  /^https?:\/\//i.test(url.trim()) ? url.trim() : '';

// 식탁 위에 놓인 도트 초대장 봉투 (그림이 없을 때 코드로 그려요)
function PixelEnvelope() {
  return (
    <svg
      viewBox="0 0 16 12"
      className="h-full w-full drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="0" y="1" width="16" height="11" fill="#3b2a20" />
      <rect x="1" y="2" width="14" height="9" fill="#fdf6e3" />
      {/* 접힌 뚜껑 (계단 모양 V) */}
      <rect x="1" y="2" width="2" height="1" fill="#d6c7b0" />
      <rect x="13" y="2" width="2" height="1" fill="#d6c7b0" />
      <rect x="3" y="3" width="2" height="1" fill="#d6c7b0" />
      <rect x="11" y="3" width="2" height="1" fill="#d6c7b0" />
      <rect x="5" y="4" width="2" height="1" fill="#d6c7b0" />
      <rect x="9" y="4" width="2" height="1" fill="#d6c7b0" />
      {/* 빨간 밀랍 도장 */}
      <rect x="7" y="4" width="2" height="1" fill="#c8323a" />
      <rect x="6" y="5" width="4" height="2" fill="#c8323a" />
      <rect x="7" y="7" width="2" height="1" fill="#c8323a" />
      <rect x="7" y="5" width="1" height="1" fill="#f87171" />
    </svg>
  );
}

// 그룹 통화 초대장 (식탁 위 봉투 + 초대장 창)
//  - 통화 정보는 data.js의 call에 적어요
//  - "참석할게요"를 누르면 Firebase "callRsvp"에 이름이 모여요
// 봉투 위에 통통 뜨는 픽셀 느낌표 (아직 초대장을 안 열어 봤을 때)
function PixelAlert({ x, y }) {
  return (
    <div
      className="pointer-events-none absolute z-[11] flex w-0 justify-center"
      style={{ left: x, top: y }}
    >
      <style>{`
        @keyframes alert-hop { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
        .alert-hop { animation: alert-hop .8s steps(3, jump-none) infinite; }
      `}</style>
      <div className="alert-hop flex shrink-0 flex-col items-center">
        <span className="flex h-14 w-10 items-center justify-center border-4 border-[#1a110e] bg-amber-300 text-4xl font-black leading-none text-[#1a110e] shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]">
          !
        </span>
        <span className="h-2 w-4 bg-[#1a110e]" />
      </div>
    </div>
  );
}
export default function CallInvite({
  mapW,
  mapH,
  open,
  onOpen,
  onClose,
  nickname,
  hideMarker = false,
}) {
  const call = partyData?.call ?? {};
  const links = (call.links ?? [])
    .map((l) => ({ ...l, url: safeUrl(l.url) }))
    .filter((l) => l.url);
  const [rsvp, setRsvp] = useState([]);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const s = SPOTS.invite ?? { x: 0.655, y: 0.6, w: 0.05, h: 0.06 }; // 위치가 없으면 기본 자리
  const myKey = toKey(nickname || '손님');
  const joined = rsvp.some((r) => r.id === myKey);

  // 느낌표: 초대장을 한 번 열어 보면 사라져요 (이 브라우저에 기억)
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    try {
      setSeen(localStorage.getItem('partyInviteSeen') === '1');
    } catch {
      setSeen(false);
    }
  }, []);
  useEffect(() => {
    if (!open) return;
    setSeen(true);
    try {
      localStorage.setItem('partyInviteSeen', '1');
    } catch {}
  }, [open]);

  // 참석자 목록 실시간 구독 (창이 열려 있을 때만)
  useEffect(() => {
    if (!open || !db) return;
    const unsubscribe = onValue(
      ref(db, 'callRsvp'),
      (snap) => {
        const list = [];
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        list.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
        setRsvp(list);
        setError('');
      },
      () =>
        setError(
          '참석자 목록을 불러오지 못했어요. Firebase 규칙을 확인해 주세요.'
        )
    );
    return () => unsubscribe();
  }, [open]);

  const toggleRsvp = async () => {
    if (!db) {
      setError('Firebase 설정이 아직 안 되어 있어요 (lib/firebase.js)');
      return;
    }
    const r = ref(db, `callRsvp/${myKey}`);
    try {
      if (joined) await remove(r);
      else await set(r, { nickname: nickname || '손님', at: Date.now() });
    } catch {
      setError('저장하지 못했어요. Firebase 규칙을 확인해 주세요.');
    }
  };

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      window.prompt('아래 주소를 복사해 주세요', url);
    }
  };

  return (
    <>
      {/* 식탁 위 초대장 봉투 (클릭해도 열려요) */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="그룹 통화 초대장 열기"
        title="📞 그룹 통화 초대장"
        className="absolute outline-none transition hover:scale-110 focus-visible:scale-110"
        style={{
          left: s.x * mapW,
          top: s.y * mapH,
          width: s.w * mapW,
          height: s.h * mapH,
        }}
      >
        <MapImage
          src={call.image}
          alt="초대장"
          x={0}
          y={0}
          width="100%"
          height="100%"
          fallback={<PixelEnvelope />}
        />
      </button>

      {/* 아직 안 열어 봤으면 봉투 위에 "!" (가까이 가서 버튼이 뜨면 잠깐 숨김) */}
      {!seen && !hideMarker && (
        <PixelAlert x={s.x * mapW + (s.w * mapW) / 2} y={s.y * mapH - 76} />
      )}

      {/* 초대장 창 */}
      <PixelModal
        open={open}
        onClose={onClose}
        label="💌 초대장"
        title={call.title || '그룹 통화 초대장'}
        width={500}
      >
        {/* 편지지 */}
        <div className="border-4 border-[#1a110e] bg-[#fdf6e3] p-5 text-[#2b1d1a] shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]">
          {call.time && (
            <p className="inline-block bg-[#c8323a] px-2 py-0.5 text-sm font-black text-white">
              🗓️ {call.time}
            </p>
          )}
          {call.message && (
            <p className="mt-3 whitespace-pre-wrap leading-relaxed">
              {call.message}
            </p>
          )}
          {call.host && (
            <p className="mt-3 text-right text-sm font-bold text-[#5b3b2a]">
              — {call.host} 드림
            </p>
          )}
        </div>

        {/* 참여 버튼 */}
        <div className="mt-4 flex flex-col gap-2">
          {links.length === 0 && (
            <p className="text-center text-sm text-white/60">
              data.js의 call.links에 통화 주소를 넣어 주세요
            </p>
          )}
          {links.map((l) => (
            <div key={l.url} className="flex items-stretch gap-2">
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 border-4 border-[#1a110e] bg-amber-400 py-2 font-black text-[#2b1d1a] shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] transition hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                📹 {l.label || '통화 참여하기'}
              </a>
              <button
                type="button"
                onClick={() => copy(l.url)}
                className="w-24 shrink-0 border-4 border-[#1a110e] bg-[#6e4833] text-sm font-black text-amber-100 hover:bg-[#7d5440]"
              >
                {copied === l.url ? '복사됨 ✓' : '링크 복사'}
              </button>
            </div>
          ))}
          {links.some((l) => l.note) && (
            <ul className="mt-1 text-xs text-white/60">
              {links
                .filter((l) => l.note)
                .map((l) => (
                  <li key={l.url}>
                    · {l.label}: {l.note}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* 참석 표시 */}
        <div className="mt-5 border-t-4 border-dashed border-white/15 pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-amber-200">
              🙋 참석할게요 {rsvp.length}명
            </p>
            <button
              type="button"
              onClick={toggleRsvp}
              className={`border-4 border-[#1a110e] px-3 py-1 text-sm font-black ${
                joined
                  ? 'bg-lime-300 text-[#1a110e]'
                  : 'bg-[#f5e6c8] text-[#2b1d1a] hover:bg-white'
              }`}
            >
              {joined ? '참석 ✓ (취소하기)' : '나도 참석할게요'}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
          {rsvp.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {rsvp.map((r) => (
                <span
                  key={r.id}
                  className="bg-black/30 px-2 py-0.5 text-xs font-bold text-white ring-1 ring-white/15"
                >
                  {r.nickname}
                </span>
              ))}
            </div>
          )}
        </div>
      </PixelModal>
    </>
  );
}
