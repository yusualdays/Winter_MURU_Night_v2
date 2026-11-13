'use client';

import { useEffect, useRef, useState } from 'react';
import { partyData } from '../data';

// ===== 설정 =====
const PLAYER_WIDTH = 280; // 유튜브 정책: 플레이어는 최소 200x200 이상 보여야 해요
const PLAYER_HEIGHT = 200;
const VOLUME = 50; // 0~100

// 유튜브 주소에서 영상 ID만 뽑기 (watch?v=, youtu.be/, shorts/, embed/ 모두 지원)
function getVideoId(url = '') {
  const match = url.match(
    /(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

// 유튜브 IFrame Player API 스크립트를 한 번만 불러오기
let apiPromise = null;
function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject();
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

// 스피커 아이콘 (재생 중이면 음파가 퍼짐)
function SpeakerIcon({ playing }) {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
      <path d="M5 12h5l7-6v20l-7-6H5z" fill="currentColor" />
      {playing ? (
        <>
          <path
            className="bgm-wave"
            d="M21 11.5a6 6 0 0 1 0 9"
            stroke="currentColor"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            className="bgm-wave bgm-wave-2"
            d="M24.5 8a11 11 0 0 1 0 16"
            stroke="currentColor"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <path
          d="M21 13l6 6M27 13l-6 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function BgmPlayer() {
  const videoId = getVideoId(partyData?.bgmYoutubeLink);

  const hostRef = useRef(null); // 유튜브 플레이어가 들어갈 자리
  const playerRef = useRef(null); // 유튜브 플레이어 객체
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  // 페이지가 열리면 유튜브 플레이어를 미리 준비 (재생은 아직 안 함)
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;

      // React가 관리하지 않는 빈 div를 만들어 그 자리에 플레이어를 넣기
      const target = document.createElement('div');
      hostRef.current.appendChild(target);

      playerRef.current = new YT.Player(target, {
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          loop: 1,
          playlist: videoId, // 한 곡 반복하려면 같은 ID를 playlist에도 넣어야 해요
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (e) => {
            e.target.setVolume(VOLUME);
            setReady(true);
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            if (
              e.data === YT.PlayerState.PAUSED ||
              e.data === YT.PlayerState.ENDED
            )
              setPlaying(false);
          },
          onError: () => {
            setError(true);
            setPlaying(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
      if (hostRef.current) hostRef.current.innerHTML = '';
      setReady(false);
    };
  }, [videoId]);

  const toggle = () => {
    const player = playerRef.current;
    if (!player || !ready) return;
    setError(false);
    if (playing) {
      player.pauseVideo();
      setPlaying(false);
    } else {
      player.playVideo();
      setPlaying(true);
    }
  };

  let message = '';
  if (!videoId) message = 'data.js에 유튜브 링크를 넣어 주세요';
  else if (error)
    message =
      "영상을 재생할 수 없어요. 링크와 '퍼가기 허용' 설정을 확인해 주세요";
  else if (!ready) message = 'BGM 준비 중...';

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <style>{`
        @keyframes bgm-wave { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        .bgm-wave   { animation: bgm-wave 1.2s ease-in-out infinite; }
        .bgm-wave-2 { animation-delay: .3s; }
        @keyframes bgm-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,.45) } 50% { box-shadow: 0 0 0 10px rgba(251,191,36,0) } }
        .bgm-glow { animation: bgm-glow 2s ease-out infinite; }
      `}</style>

      {/* 유튜브 미니 플레이어: 재생 중에만 보이고, 멈추면 살짝 사라짐 */}
      {videoId && (
        <div
          ref={hostRef}
          className={`overflow-hidden rounded-xl bg-black shadow-2xl ring-2 ring-amber-200/40 transition-all duration-300 ${
            playing
              ? 'opacity-100'
              : 'pointer-events-none translate-y-2 opacity-0'
          }`}
          style={{ width: PLAYER_WIDTH, height: PLAYER_HEIGHT }}
        />
      )}

      {message && (
        <p className="max-w-[240px] rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-amber-100 shadow-lg">
          {message}
        </p>
      )}

      {/* 스피커 버튼 */}
      <button
        type="button"
        onClick={toggle}
        disabled={!videoId || !ready}
        aria-label={playing ? 'BGM 일시정지' : 'BGM 재생'}
        title={playing ? 'BGM 일시정지' : 'BGM 재생'}
        className={`flex h-14 w-14 items-center justify-center rounded-full border border-amber-200/30 bg-gradient-to-br from-amber-800/90 to-stone-900/90 text-amber-100 shadow-lg backdrop-blur transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
          playing ? 'bgm-glow' : ''
        }`}
      >
        <SpeakerIcon playing={playing} />
      </button>
    </div>
  );
}
