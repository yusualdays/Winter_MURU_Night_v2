'use client';

import { useEffect, useRef } from 'react';
import { BACKGROUND_SRC, WINDOW_RECT } from '../lib/mapConfig';

// ================== 거실 분위기 (조명 + 창밖 날씨) ==================
// 맵 안에 넣어서 써요. 클릭을 막지 않아요 (pointer-events-none).

// 조명 모드 3가지
export const LIGHTING_MODES = [
  { id: 'default', icon: '☀️', label: '기본 밝기' },
  { id: 'warm', icon: '🕯️', label: '따뜻한 무드등' },
  { id: 'night', icon: '🌙', label: '아늑한 밤 조명' },
];

// 창밖 날씨 3가지
export const WEATHER_MODES = [
  { id: 'snow', icon: '❄️', label: '잔잔한 눈' },
  { id: 'blizzard', icon: '☃️', label: '함박눈 펑펑' },
  { id: 'fireworks', icon: '🎆', label: '연말 불꽃놀이' },
];

// 조명 색 (multiply = 그림 색에 곱해서 자연스럽게 물들여요)
const LIGHT_LAYERS = {
  warm: [
    { background: 'rgba(255, 168, 82, 0.32)', mixBlendMode: 'multiply' },
    {
      background:
        'radial-gradient(ellipse at 50% 45%, rgba(255, 200, 120, 0.18) 0%, transparent 60%)',
      mixBlendMode: 'screen',
    },
  ],
  night: [
    { background: 'rgba(40, 52, 130, 0.62)', mixBlendMode: 'multiply' },
    {
      background:
        'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(8, 10, 35, 0.45) 100%)',
    }, // 가장자리 어둡게
    {
      background:
        'radial-gradient(circle at 6% 70%, rgba(255, 190, 100, 0.25) 0%, transparent 18%)',
      mixBlendMode: 'screen',
    }, // 트리 불빛
  ],
};

// ---------- 창문 날씨 파티클 (배경 그림의 도트 1칸 = 파티클 1칸) ----------
const FIREWORK_COLORS = [
  '#ff5d73',
  '#ffd166',
  '#7bdff2',
  '#b8f2a0',
  '#f7a1ff',
  '#ffffff',
];

function WindowWeather({ weather, mapW, mapH }) {
  const canvasRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    let frameId;
    let cancelled = false;
    const img = new window.Image();

    const start = (nw, nh, maskData) => {
      if (cancelled) return;
      // 창문 영역을 배경 그림의 원래 도트 크기로 계산 (예: 400x299 그림에서 64x48칸)
      const x0 = Math.round(WINDOW_RECT.x * nw);
      const y0 = Math.round(WINDOW_RECT.y * nh);
      const cw = Math.max(1, Math.round(WINDOW_RECT.w * nw));
      const ch = Math.max(1, Math.round(WINDOW_RECT.h * nh));

      const canvas = canvasRef.current;
      const box = boxRef.current;
      if (!canvas || !box) return;
      canvas.width = cw;
      canvas.height = ch;
      // 맵 위에서 창문 위치에 딱 맞게 (도트 1칸 = 맵 mapW/nw px)
      Object.assign(box.style, {
        left: `${(x0 / nw) * mapW}px`,
        top: `${(y0 / nh) * mapH}px`,
        width: `${(cw / nw) * mapW}px`,
        height: `${(ch / nh) * mapH}px`,
      });

      // 하늘(어두운 칸)에만 그리기 — 창틀 위에는 안 그려요
      const isSky = (x, y) => {
        if (!maskData) return true;
        const px = Math.floor(x) + x0;
        const py = Math.floor(y) + y0;
        if (px < 0 || py < 0 || px >= nw || py >= nh) return false;
        const i = (py * nw + px) * 4;
        return (maskData[i] + maskData[i + 1] + maskData[i + 2]) / 3 < 110;
      };

      const ctx = canvas.getContext('2d');
      let flakes = [];
      let sparks = [];
      let nextBoom = 0;

      // 눈송이 만들기
      const heavy = weather === 'blizzard';
      const flakeCount =
        weather === 'fireworks'
          ? 0
          : heavy
          ? Math.round(cw * ch * 0.04)
          : Math.round(cw * ch * 0.012);
      const makeFlake = (anyY) => ({
        x: Math.random() * cw,
        y: anyY ? Math.random() * ch : -2,
        speed: heavy ? 9 + Math.random() * 10 : 3 + Math.random() * 4, // 칸/초
        drift: (Math.random() - 0.5) * (heavy ? 6 : 2),
        phase: Math.random() * Math.PI * 2,
        size: heavy && Math.random() < 0.35 ? 2 : 1,
      });
      flakes = Array.from({ length: flakeCount }, () => makeFlake(true));

      // 불꽃 하나 터뜨리기
      const boom = () => {
        const cx = cw * (0.2 + Math.random() * 0.6);
        const cy = ch * (0.2 + Math.random() * 0.35);
        const color =
          FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
        const n = 26 + Math.floor(Math.random() * 12);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const sp = 14 + Math.random() * 10;
          // 바깥 링 + 안쪽 링 (두 겹으로 화려하게)
          sparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 1,
            color,
          });
          if (i % 2 === 0)
            sparks.push({
              x: cx,
              y: cy,
              vx: Math.cos(a) * sp * 0.5,
              vy: Math.sin(a) * sp * 0.5,
              life: 0.9,
              color: '#ffffff',
            });
        }
        sparks.push({
          x: cx,
          y: cy,
          vx: 0,
          vy: 0,
          life: 0.5,
          color: '#ffffff',
          flash: true,
        });
      };

      let last = performance.now();
      const tick = (now) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        ctx.clearRect(0, 0, cw, ch);

        // 눈
        ctx.fillStyle = '#ffffff';
        for (const f of flakes) {
          f.phase += dt * 2;
          f.y += f.speed * dt;
          f.x += (f.drift + Math.sin(f.phase) * (heavy ? 2 : 1)) * dt;
          if (f.y > ch + 2) Object.assign(f, makeFlake(false));
          if (f.x < -2) f.x = cw + 1;
          if (f.x > cw + 2) f.x = -1;
          if (isSky(f.x, f.y))
            ctx.fillRect(Math.floor(f.x), Math.floor(f.y), f.size, f.size);
        }

        // 불꽃놀이
        if (weather === 'fireworks') {
          nextBoom -= dt;
          if (nextBoom <= 0) {
            boom();
            if (Math.random() < 0.35) setTimeout(boom, 180); // 가끔 연달아 팡팡
            nextBoom = 0.45 + Math.random() * 0.7;
          }
          sparks = sparks.filter((s) => s.life > 0);
          for (const s of sparks) {
            s.life -= dt * (s.flash ? 4 : 0.7);
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vx *= 1 - dt * 1.5;
            s.vy = s.vy * (1 - dt * 1.5) + 9 * dt; // 중력
            // 도트 느낌: 투명도를 3단계로만
            const alpha = s.life > 0.66 ? 1 : s.life > 0.33 ? 0.6 : 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = s.color;
            const size = s.flash ? 3 : 1;
            if (isSky(s.x, s.y))
              ctx.fillRect(
                Math.floor(s.x) - (size >> 1),
                Math.floor(s.y) - (size >> 1),
                size,
                size
              );
          }
          ctx.globalAlpha = 1;
        }

        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    };

    // 배경 그림을 읽어서 하늘 칸 찾기 (못 읽으면 창문 네모 전체에 그려요)
    img.onload = () => {
      let data = null;
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const cx = c.getContext('2d');
        cx.drawImage(img, 0, 0);
        data = cx.getImageData(0, 0, c.width, c.height).data;
      } catch {}
      start(img.naturalWidth, img.naturalHeight, data);
    };
    img.onerror = () => start(400, 299, null);
    img.src = BACKGROUND_SRC;

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [weather, mapW, mapH]);

  return (
    <div ref={boxRef} className="pointer-events-none absolute z-[9]">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

// 거실 분위기: 창밖 날씨 + 조명 오버레이
//  - lighting: "default" | "warm" | "night"
//  - weather:  "snow" | "blizzard" | "fireworks"
export default function RoomAmbience({
  lighting = 'default',
  weather = 'snow',
  mapW,
  mapH,
}) {
  return (
    <>
      {/* 조명: 모드마다 레이어를 깔아 두고 투명도만 바꿔서 부드럽게 전환 (아바타보다 아래) */}
      {Object.entries(LIGHT_LAYERS).map(([mode, layers]) =>
        layers.map((style, i) => (
          <div
            key={`${mode}-${i}`}
            className="pointer-events-none absolute inset-0 z-[9] transition-opacity duration-700"
            style={{ ...style, opacity: lighting === mode ? 1 : 0 }}
          />
        ))
      )}

      {/* 창밖 날씨 (조명보다 위에 그려서 밤 조명에서도 눈·불꽃이 또렷하게) */}
      <WindowWeather key={weather} weather={weather} mapW={mapW} mapH={mapH} />
    </>
  );
}
