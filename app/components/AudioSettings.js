"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { partyData } from "../data";
import { startFire, stopFire, setFireVolume as applyFireVolume } from "../lib/fireSound";
import { LIGHTING_MODES, WEATHER_MODES } from "./RoomAmbience";

// 도트 느낌 테두리 (모서리를 계단 모양으로 깎기)
const PIXEL_CORNERS =
  "polygon(0 6px, 6px 6px, 6px 0, calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px))";

// ---------- 픽셀 톱니바퀴 아이콘 ----------
const GEAR = [
  "...KK...",
  ".K.KK.K.",
  "..KKKK..",
  "KKK..KKK",
  "KKK..KKK",
  "..KKKK..",
  ".K.KK.K.",
  "...KK...",
];
function PixelGear({ color = "#fde68a" }) {
  return (
    <svg viewBox="0 0 8 8" width="22" height="22" shapeRendering="crispEdges" aria-hidden="true">
      {GEAR.flatMap((row, y) => [...row].map((c, x) => (c === "K" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} /> : null)))}
    </svg>
  );
}

// ---------- 볼륨 한 줄 ----------
function VolumeRow({ icon, label, playing, onToggle, volume, onVolume, disabled, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={`${label} ${playing ? "일시정지" : "재생"}`}
          className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#2b1d1a] text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            playing ? "bg-amber-400 text-[#2b1d1a]" : "bg-[#5b3b2a] text-amber-100 hover:bg-[#6e4833]"
          }`}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center justify-between text-xs font-bold text-[#2b1d1a]">
            <span>
              {icon} {label}
            </span>
            <span className="tabular-nums text-[#5b3b2a]">{volume === 0 ? "🔇" : `${volume}%`}</span>
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
                  ? "bg-amber-400 text-[#2b1d1a] shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.2)]"
                  : "bg-[#efe0c0] text-[#5b3b2a] hover:bg-white"
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

// ================== 설정 (⚙️ 버튼 + 팝업) + 화면 없는 BGM ==================
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

  // --- BGM (내 음악 파일, 화면에 플레이어 없이 소리만) ---
  const bgmSrc = partyData?.bgmFile || "";
  const audioRef = useRef(null);
  const [bgmError, setBgmError] = useState(false);
  const autoStartAt = useRef(0); // "첫 터치로 재생"한 시각 (같은 터치로 바로 멈추지 않게)

  useEffect(() => {
    if (!bgmSrc) return;
    const audio = new Audio(bgmSrc);
    audio.loop = true; // 끝나면 처음부터 다시
    audio.preload = "auto";
    audio.volume = bgmVolume / 100;
    audioRef.current = audio;

    const onPlay = () => setBgmPlaying(true);
    const onPause = () => setBgmPlaying(false);
    const onError = () => {
      setBgmError(true);
      setBgmPlaying(false);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    // 거실에 들어오면 자동 재생 (data.js에서 bgmAutoplay: false 로 끌 수 있어요)
    //  → 브라우저가 막으면, 화면을 처음 누르거나 키를 누르는 순간 재생
    const startOnTouch = () => {
      removeWaiters();
      autoStartAt.current = Date.now();
      audio.play().catch(() => {});
    };
    const removeWaiters = () => {
      window.removeEventListener("pointerdown", startOnTouch);
      window.removeEventListener("keydown", startOnTouch);
    };
    if (partyData?.bgmAutoplay !== false) {
      audio.play().catch(() => {
        window.addEventListener("pointerdown", startOnTouch);
        window.addEventListener("keydown", startOnTouch);
      });
    }

    return () => {
      removeWaiters();
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgmSrc, setBgmPlaying]);

  // 볼륨 (아이폰은 브라우저에서 볼륨을 바꿀 수 없어서, 폰 옆 음량 버튼으로 조절돼요)
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = bgmVolume / 100;
  }, [bgmVolume]);

  const toggleBgm = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Date.now() - autoStartAt.current < 600) return; // 방금 첫 터치로 켜졌으면 그대로 두기
    setBgmError(false);
    if (audio.paused) audio.play().catch(() => setBgmError(true));
    else audio.pause();
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
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  let bgmHint = "";
  if (!bgmSrc) bgmHint = "data.js의 bgmFile에 음악 파일 주소를 넣어 주세요 (예: /bgm.mp3)";
  else if (bgmError) bgmHint = "음악 파일을 찾을 수 없어요. public 폴더의 파일 이름을 확인해 주세요";

  return (
    <>
      {/* ⚙️ 설정 버튼 + 팝업 (오른쪽 위) */}
      <div ref={panelRef} className="fixed right-4 top-4 z-40">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="오디오 설정"
          title="오디오 설정"
          className="flex h-12 w-12 items-center justify-center bg-[#2b1d1a] transition hover:scale-105 active:scale-95"
          style={{ clipPath: PIXEL_CORNERS }}
        >
          <span className="flex h-10 w-10 items-center justify-center bg-[#6e4833]" style={{ clipPath: PIXEL_CORNERS }}>
            <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.3 }} className="flex">
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
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 top-14 w-80 origin-top-right bg-[#2b1d1a] p-1 shadow-[6px_6px_0_0_rgba(0,0,0,0.35)]"
              style={{ clipPath: PIXEL_CORNERS }}
            >
              <div className="bg-[#f5e6c8] p-4" style={{ clipPath: PIXEL_CORNERS }}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black text-[#2b1d1a]">⚙️ 설정</p>
                  <button type="button" onClick={() => setOpen(false)} className="px-1 text-lg leading-none text-[#5b3b2a] hover:text-[#2b1d1a]" aria-label="닫기">
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
                    disabled={!bgmSrc}
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
                  <p className="mb-2 text-sm font-black text-[#2b1d1a]">🏠 거실 분위기</p>
                  <div className="flex flex-col gap-3">
                    <ChoiceRow title="💡 거실 조명" options={LIGHTING_MODES} value={lighting} onChange={setLighting} />
                    <ChoiceRow title="🪟 창밖 날씨" options={WEATHER_MODES} value={weather} onChange={setWeather} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
