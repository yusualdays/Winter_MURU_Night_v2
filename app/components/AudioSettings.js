'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { partyData } from '../data';
import {
  startFire,
  stopFire,
  setFireVolume as applyFireVolume,
} from '../lib/fireSound';
import { LIGHTING_MODES, WEATHER_MODES } from './RoomAmbience';

// 유튜브 정책: 플레이어는 최소 200x200 이상 보여야 해요 → 허용되는 가장 작은 크기
const PLAYER_SIZE = 200;

// 도트 느낌 테두리 (모서리를 계단 모양으로 깎기)
const PIXEL_CORNERS =
  'polygon(0 6px, 6px 6px, 6px 0, calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px))';

// ---------- 유튜브 ----------
function getVideoId(url = '') {
  const match = url.match(
    /(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

let apiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);
  });
  return apiPromise;
}

// ---------- 픽셀 톱니바퀴 아이콘 ----------
const GEAR = [
  '...KK...',
  '.K.KK.K.',
  '..KKKK..',
  'KKK..KKK',
  'KKK..KKK',
  '..KKKK..',
  '.K.KK.K.',
  '...KK...',
];
function PixelGear({ color = '#fde68a' }) {
  return (
    <svg
      viewBox="0 0 8 8"
      width="22"
      height="22"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {GEAR.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === 'K' ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ---------- 볼륨 한 줄 ----------
function VolumeRow({
  icon,
  label,
  playing,
  onToggle,
  volume,
  onVolume,
  disabled,
  hint,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={`${label} ${playing ? '일시정지' : '재생'}`}
          className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#2b1d1a] text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            playing
              ? 'bg-amber-400 text-[#2b1d1a]'
              : 'bg-[#5b3b2a] text-amber-100 hover:bg-[#6e4833]'
          }`}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center justify-between text-xs font-bold text-[#2b1d1a]">
            <span>
              {icon} {label}
            </span>
            <span className="tabular-nums text-[#5b3b2a]">
              {volume === 0 ? '🔇' : `${volume}%`}
            </span>
          </p>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
            onPointerUp={(e) => e.currentTarget.blur()} // 놓으면 포커스 해제 → 방향키가 다시 캐릭터로
            aria-label={`${label} 볼륨`}
            className="mt-1 h-1.5 w-full cursor-pointer accent-[#c8323a]"
          />
        </div>
      </div>
      {hint && <p className="pl-11 text-[11px] text-[#a8433a]">{hint}</p>}
    </div>
  );
}

// ---------- 3개 중 하나 고르기 (거실 분위기) ----------
function ChoiceRow({ title, options, value, onChange }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-[#2b1d1a]">{title}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={(e) => {
                onChange(o.id);
                e.currentTarget.blur(); // 누른 뒤 방향키가 다시 캐릭터로
              }}
              aria-pressed={active}
              className={`flex flex-col items-center gap-0.5 border-2 border-[#2b1d1a] px-1 py-1.5 text-[11px] font-bold leading-tight transition ${
                active
                  ? 'bg-amber-400 text-[#2b1d1a] shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.2)]'
                  : 'bg-[#efe0c0] text-[#5b3b2a] hover:bg-white'
              }`}
            >
              <span className="text-lg leading-none">{o.icon}</span>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ================== 오디오 설정 (⚙️ 버튼 + 팝업 + 유튜브 미니 플레이어) ==================
export default function AudioSettings({
  bgmPlaying,
  setBgmPlaying,
  bgmVolume,
  setBgmVolume,
  firePlaying,
  setFirePlaying,
  fireVolume,
  setFireVolume,
  lighting,
  setLighting,
  weather,
  setWeather,
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // --- 유튜브 BGM ---
  const videoId = getVideoId(partyData?.bgmYoutubeLink);
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [bgmError, setBgmError] = useState(false);
  const [slow, setSlow] = useState(false); // 10초가 지나도 준비가 안 되면 안내
  const volumeRef = useRef(bgmVolume);
  volumeRef.current = bgmVolume;

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    let removeWaiters = () => {}; // 자동 재생이 막혔을 때 걸어 둔 "첫 클릭 기다리기"를 지우는 함수
    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      // 유튜브 창(iframe)을 직접 만들어요
      //  - credentialless: StackBlitz 미리보기처럼 보안이 엄격한 곳에서도 유튜브 창이 막히지 않게
      const iframe = document.createElement('iframe');
      iframe.setAttribute('credentialless', '');
      iframe.width = String(PLAYER_SIZE);
      iframe.height = String(PLAYER_SIZE);
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.title = '파티 BGM';
      const params = new URLSearchParams({
        enablejsapi: '1',
        controls: '1',
        loop: '1',
        playlist: videoId,
        playsinline: '1',
        rel: '0',
        origin: window.location.origin,
      });
      iframe.src = `https://www.youtube.com/embed/${videoId}?${params}`;
      hostRef.current.appendChild(iframe);
      playerRef.current = new YT.Player(iframe, {
        events: {
          onReady: (e) => {
            e.target.setVolume(volumeRef.current);
            setReady(true);

            // 거실에 들어오면 BGM 자동 재생 (data.js에서 bgmAutoplay: false 로 끌 수 있어요)
            if (partyData?.bgmAutoplay === false) return;
            e.target.playVideo();
            // 브라우저가 자동 재생을 막았으면 → 화면을 처음 클릭하거나 키를 누르는 순간 재생
            setTimeout(() => {
              if (cancelled) return;
              const state = e.target.getPlayerState?.();
              if (
                state === YT.PlayerState.PLAYING ||
                state === YT.PlayerState.BUFFERING
              )
                return;
              const start = () => {
                removeWaiters();
                if (!cancelled) e.target.playVideo();
              };
              window.addEventListener('pointerdown', start);
              window.addEventListener('keydown', start);
              removeWaiters = () => {
                window.removeEventListener('pointerdown', start);
                window.removeEventListener('keydown', start);
              };
            }, 1500);
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setBgmPlaying(true);
            if (
              e.data === YT.PlayerState.PAUSED ||
              e.data === YT.PlayerState.ENDED
            )
              setBgmPlaying(false);
          },
          onError: () => {
            setBgmError(true);
            setBgmPlaying(false);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      removeWaiters();
      playerRef.current?.destroy?.();
      playerRef.current = null;
      if (hostRef.current) hostRef.current.innerHTML = '';
      setReady(false);
    };
  }, [videoId, setBgmPlaying]);

  useEffect(() => {
    if (ready) playerRef.current?.setVolume?.(bgmVolume);
  }, [bgmVolume, ready]);

  // 10초 안에 준비가 안 되면 안내 문구 보여주기
  useEffect(() => {
    setSlow(false);
    if (!videoId || ready) return;
    const timer = setTimeout(() => setSlow(true), 10000);
    return () => clearTimeout(timer);
  }, [videoId, ready]);

  const toggleBgm = () => {
    const player = playerRef.current;
    if (!player || !ready) return;
    setBgmError(false);
    if (bgmPlaying) {
      player.pauseVideo();
      setBgmPlaying(false);
    } else {
      player.playVideo();
      setBgmPlaying(true);
    }
  };

  // --- 장작불 ASMR ---
  useEffect(() => {
    applyFireVolume(fireVolume);
  }, [fireVolume]);

  useEffect(() => () => stopFire(), []); // 거실을 나가면 소리 끄기

  const toggleFire = () => {
    if (firePlaying) {
      stopFire();
      setFirePlaying(false);
    } else {
      applyFireVolume(fireVolume);
      setFirePlaying(startFire());
    }
  };

  // --- 팝업: ESC / 바깥 클릭으로 닫기 ---
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  let bgmHint = '';
  if (!videoId)
    bgmHint = 'data.js의 bgmYoutubeLink에 유튜브 주소를 넣어 주세요';
  else if (bgmError)
    bgmHint =
      "영상을 재생할 수 없어요. 공개 설정과 '퍼가기 허용'을 확인해 주세요";
  else if (!ready && slow)
    bgmHint =
      '유튜브가 열리지 않아요. 미리보기 오른쪽 위 ↗ 버튼으로 새 탭에서 열어 보세요';
  else if (!ready) bgmHint = 'BGM 준비 중...';

  return (
    <>
      {/* ⚙️ 설정 버튼 + 팝업 (오른쪽 위, 롤링페이퍼 ❄️ 버튼 왼쪽) */}
      <div ref={panelRef} className="fixed right-4 top-4 z-40">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="오디오 설정"
          title="오디오 설정"
          className="flex h-12 w-12 items-center justify-center bg-[#2b1d1a] transition hover:scale-105 active:scale-95"
          style={{ clipPath: PIXEL_CORNERS }}
        >
          <span
            className="flex h-10 w-10 items-center justify-center bg-[#6e4833]"
            style={{ clipPath: PIXEL_CORNERS }}
          >
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.3 }}
              className="flex"
            >
              <PixelGear />
            </motion.span>
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 top-14 w-80 origin-top-right bg-[#2b1d1a] p-1 shadow-[6px_6px_0_0_rgba(0,0,0,0.35)]"
              style={{ clipPath: PIXEL_CORNERS }}
            >
              <div
                className="bg-[#f5e6c8] p-4"
                style={{ clipPath: PIXEL_CORNERS }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black text-[#2b1d1a]">⚙️ 설정</p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-1 text-lg leading-none text-[#5b3b2a] hover:text-[#2b1d1a]"
                    aria-label="닫기"
                  >
                    ×
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <VolumeRow
                    icon="🎵"
                    label="BGM"
                    playing={bgmPlaying}
                    onToggle={toggleBgm}
                    volume={bgmVolume}
                    onVolume={setBgmVolume}
                    disabled={!videoId || !ready}
                    hint={bgmHint}
                  />
                  <VolumeRow
                    icon="🔥"
                    label="장작불 ASMR"
                    playing={firePlaying}
                    onToggle={toggleFire}
                    volume={fireVolume}
                    onVolume={setFireVolume}
                  />
                </div>

                {/* 거실 분위기 설정 (나에게만 적용돼요) */}
                <div className="mt-4 border-t-2 border-dashed border-[#2b1d1a]/25 pt-3">
                  <p className="mb-2 text-sm font-black text-[#2b1d1a]">
                    🏠 거실 분위기
                  </p>
                  <div className="flex flex-col gap-3">
                    <ChoiceRow
                      title="💡 거실 조명"
                      options={LIGHTING_MODES}
                      value={lighting}
                      onChange={setLighting}
                    />
                    <ChoiceRow
                      title="🪟 창밖 날씨"
                      options={WEATHER_MODES}
                      value={weather}
                      onChange={setWeather}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 유튜브 미니 플레이어 (PIP): BGM이 재생 중일 때 오른쪽 아래 구석에 */}
      {videoId && (
        <div
          className={`fixed bottom-4 right-4 z-30 transition-all duration-300 max-md:bottom-auto max-md:left-4 max-md:right-auto max-md:top-4 ${
            bgmPlaying
              ? 'opacity-100'
              : 'pointer-events-none translate-y-3 opacity-0'
          }`}
        >
          {/* 이름표 */}
          <p className="mb-1 ml-1 inline-block bg-[#2b1d1a] px-2 py-0.5 text-[10px] font-bold text-amber-200">
            ♪ NOW PLAYING
          </p>
          {/* 도트 테두리: 진한 갈색 → 크림색 → 진한 갈색 3겹 */}
          <div
            className="bg-[#2b1d1a] p-1 shadow-[6px_6px_0_0_rgba(0,0,0,0.35)]"
            style={{ clipPath: PIXEL_CORNERS }}
          >
            <div
              className="bg-[#f5e6c8] p-1"
              style={{ clipPath: PIXEL_CORNERS }}
            >
              <div className="bg-[#2b1d1a] p-0.5">
                <div
                  ref={hostRef}
                  className="bg-black"
                  style={{ width: PLAYER_SIZE, height: PLAYER_SIZE }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
