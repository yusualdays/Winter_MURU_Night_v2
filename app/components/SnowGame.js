
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ref, set, update, onValue, onDisconnect } from "firebase/database";
import { db } from "../lib/firebase";
import { partyData } from "../data";
import { AVATAR_WIDTH, AVATAR_HEIGHT } from "./Avatar";

// ================== ❄️ 눈덩이 피하기 서바이벌 ==================
//  - 호스트가 [🎮 눈덩이 게임 시작] 버튼(또는 G키)을 누르면
//    Firebase "snowGame"에 게임 정보가 저장되고 모두의 화면에서 동시에 시작해요
//  - 3초 카운트다운 → 20초 동안 눈덩이가 떨어져요 → 한 번도 안 맞은 사람 머리 위에 폭죽!
//  - 눈덩이 위치는 "씨앗(seed) 숫자 + 시간"으로 계산해서 모두의 화면에서 똑같이 떨어져요
//  - 누가 호스트인지는 data.js의 hostNickname (비워 두면 모두에게 버튼이 보여요)
const COUNTDOWN_MS = 3000; // 카운트다운 (3초)
const PLAY_MS = 20000;     // 게임 시간 (20초)
const RESULT_MS = 7000;    // 결과·폭죽을 보여주는 시간 (7초)
const HIT_MS = 3000;       // 맞으면 느려지는 시간 (3초)
const SLOW = 0.25;         // 맞았을 때 이동 속도 (0.25 = 4배 느리게 / 0으로 바꾸면 꽁꽁 얼어서 멈춤)
const START_KEY = "KeyG";  // 호스트 단축키 (G)
// ===============================================================

const now0 = () => Date.now();

// 씨앗 숫자로 늘 같은 "랜덤" 숫자를 만드는 함수 (모두의 화면에서 같은 눈덩이)
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 20초 동안 떨어질 눈덩이 목록 (처음엔 10개 정도, 갈수록 20개 정도까지 많아져요)
function makeBalls(seed, mapW) {
  const rand = seededRandom(seed);
  const balls = [];
  let t = 0;
  for (let id = 0; ; id++) {
    const progress = t / PLAY_MS; // 0 → 1
    const dur = 2400 + rand() * 1100 - 500 * progress; // 화면 위→아래까지 걸리는 시간
    if (t + dur > PLAY_MS) break; // 20초 안에 다 떨어지는 눈덩이만
    balls.push({
      id,
      t0: t,
      dur,
      x: 30 + rand() * (mapW - 60),
      r: 20 + Math.floor(rand() * 4) * 4, // 반지름 20~32
      drift: (rand() - 0.5) * 90,         // 살짝 옆으로 흔들리며 떨어지기
      bomb: rand() < 0.12,                // 가끔은 픽셀 폭탄 💣
    });
    t += 270 - 150 * progress; // 0.27초 → 0.12초 간격
  }
  return balls;
}

// 눈덩이 위치 (게임 시작 후 g ms)
function ballPos(b, g, mapH) {
  const p = (g - b.t0) / b.dur;
  if (p < 0 || p > 1) return null;
  return { x: b.x + b.drift * Math.sin(p * Math.PI), y: -b.r * 2 + p * (mapH + b.r * 4), p };
}

// 내 몸통 사각형 (머리~발, 양옆은 조금 안쪽으로 → 스치기만 하면 안 맞아요)
const bodyRect = (x, y) => ({ x: x + 34, y: y + 30, w: AVATAR_WIDTH - 68, h: AVATAR_HEIGHT - 36 });

// 동그라미와 사각형이 닿았는지
function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

// 도트 눈덩이 / 폭탄 그리기
const SNOW_PIX = [
  "..XXXX..",
  ".XXXXXX.",
  "XXXXXXXX",
  "XXXXXXSX",
  "XXXXXXSX",
  "XXXXXSSX",
  ".XSSSSX.",
  "..XXXX..",
];
function drawBall(ctx, x, y, r, bomb) {
  const px = (r * 2) / 8;
  const left = x - r;
  const top = y - r;
  // 검은 테두리 (모양을 상하좌우로 조금씩 밀어서 먼저 칠하기)
  ctx.fillStyle = "#1a110e";
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (SNOW_PIX[row][col] !== ".") ctx.fillRect(left + col * px + ox * px * 0.6, top + row * px + oy * px * 0.6, Math.ceil(px), Math.ceil(px));
      }
    }
  }
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const c = SNOW_PIX[row][col];
      if (c === ".") continue;
      ctx.fillStyle = bomb ? (c === "S" ? "#0f172a" : "#334155") : c === "S" ? "#bfdbfe" : "#ffffff";
      ctx.fillRect(left + col * px, top + row * px, Math.ceil(px), Math.ceil(px));
    }
  }
  if (bomb) {
    // 반짝이 + 심지
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(left + px * 2, top + px * 2, px, px);
    ctx.fillStyle = "#a16207";
    ctx.fillRect(left + px * 5, top - px * 2, px, px * 2);
    ctx.fillStyle = Math.floor(performance.now() / 120) % 2 ? "#f97316" : "#fde047";
    ctx.fillRect(left + px * 5, top - px * 3, px * 1.5, px * 1.5);
  }
}

// 지금 게임이 어느 단계인지 (서버 시간 기준이라 모두 똑같아요)
function phaseOf(game, now) {
  if (!game?.startAt) return "idle";
  const t = now - game.startAt;
  if (t < -COUNTDOWN_MS - 2000) return "idle";
  if (t < 0) return "countdown";
  if (t < PLAY_MS) return "playing";
  if (t < PLAY_MS + RESULT_MS) return "result";
  return "idle";
}

// 생존자 머리 위 픽셀 폭죽
const CONFETTI_COLORS = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc", "#f472b6", "#ffffff"];
function Confetti({ seed }) {
  const rand = seededRandom(seed);
  const pieces = Array.from({ length: 34 }, (_, i) => {
    const angle = rand() * Math.PI * 2;
    const dist = 70 + rand() * 110;
    return {
      i,
      dx: Math.cos(angle) * dist,
      up: -60 - rand() * 120,
      fall: 60 + rand() * 120,
      rot: (rand() - 0.5) * 720,
      size: 7 + Math.floor(rand() * 3) * 3,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: (i % 2) * 0.9 + rand() * 0.15, // 두 번 펑! 펑!
    };
  });
  return (
    <div className="absolute left-0 top-0">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="snow-confetti absolute block"
          style={{
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            "--dx": `${p.dx}px`,
            "--up": `${p.up}px`,
            "--fall": `${p.fall}px`,
            "--rot": `${p.rot}deg`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// 맵 위에 그리는 부분 (눈덩이·"앗!"·폭죽) + 화면 위 안내 (버튼·카운트다운·타이머·결과)
//  - myPos: 내 아바타 위치 / others: 다른 사람들 (users) / speedRef: 내 이동 속도 배율 (1 = 보통)
//  - onStart: 게임이 시작될 때 (열린 창 닫기·의자에서 일어나기)
export default function SnowGame({ mapW, mapH, myId, nickname, myPos, others, speedRef, onStart }) {
  const [game, setGame] = useState(null); // Firebase "snowGame"
  const [now, setNow] = useState(now0());
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef(null);
  const offsetRef = useRef(0);          // 내 시계와 서버 시계의 차이
  const gameRef = useRef(null);
  const posRef = useRef(myPos);
  const ballsRef = useRef({ seed: null, list: [] });
  const hitIdsRef = useRef(new Set());  // 이미 나를 맞힌 눈덩이 (내 화면에서 사라져요)
  const myHitsRef = useRef(0);
  const myHitUntilRef = useRef(0);
  const startedSeedRef = useRef(null);
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;
  posRef.current = myPos;
  gameRef.current = game;

  const serverNow = () => Date.now() + offsetRef.current;
  const phase = phaseOf(game, now);
  const host = (partyData?.hostNickname ?? "").trim();
  const isHost = !host || host === (nickname ?? "").trim();
  const players = game?.players ?? {};

  useEffect(() => setMounted(true), []);

  // 서버 시계와 맞추기 + 게임 상태 구독
  useEffect(() => {
    if (!db) return;
    const offUnsub = onValue(ref(db, ".info/serverTimeOffset"), (snap) => {
      offsetRef.current = Number(snap.val()) || 0;
    });
    const gameUnsub = onValue(ref(db, "snowGame"), (snap) => setGame(snap.val()));
    return () => {
      offUnsub();
      gameUnsub();
    };
  }, []);

  // 게임 중에는 0.1초마다 시간 갱신 (카운트다운·타이머·"앗!" 표시용)
  useEffect(() => {
    if (!game?.startAt) return;
    const timer = setInterval(() => {
      const t = serverNow();
      setNow(t);
      if (t > game.startAt + PLAY_MS + RESULT_MS + 500) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.startAt]);

  // 새 게임이 시작되면: 참가 등록 + 창 닫기·일어나기
  useEffect(() => {
    if (!game?.seed || !myId) return;
    const p = phaseOf(game, serverNow());
    if (p !== "countdown" && p !== "playing") return;
    if (startedSeedRef.current === game.seed) return;
    startedSeedRef.current = game.seed;
    hitIdsRef.current = new Set();
    myHitsRef.current = 0;
    myHitUntilRef.current = 0;
    onStartRef.current?.();
    if (db && !game.players?.[myId]) {
      const meRef = ref(db, `snowGame/players/${myId}`);
      set(meRef, { nickname, hits: 0, hitUntil: 0 }).catch(() => {});
      onDisconnect(meRef).remove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.seed, myId]);

  // 호스트: 게임 시작
  const startGame = () => {
    if (!db || !myId || !isHost) return;
    if (phaseOf(gameRef.current, serverNow()) !== "idle") return;
    const startAt = serverNow() + COUNTDOWN_MS;
    const seed = Math.floor(Math.random() * 1e9);
    set(ref(db, "snowGame"), {
      gameState: "countdown",
      startAt,
      seed,
      by: myId,
      byName: nickname,
      players: { [myId]: { nickname, hits: 0, hitUntil: 0 } },
    }).catch((err) => console.error("게임 시작 실패:", err));
    // 게임 상태 기록 (playing → ended) — 화면은 시간으로 계산해서 이 값이 늦어도 괜찮아요
    setTimeout(() => update(ref(db, "snowGame"), { gameState: "playing" }).catch(() => {}), COUNTDOWN_MS);
    setTimeout(() => update(ref(db, "snowGame"), { gameState: "ended" }).catch(() => {}), COUNTDOWN_MS + PLAY_MS);
  };
  const startRef = useRef(startGame);
  startRef.current = startGame;

  // 호스트 단축키 G
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== START_KEY || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (document.querySelector('[role="dialog"]')) return;
      startRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 눈덩이 그리기 + 내가 맞았는지 검사 (매 프레임)
  useEffect(() => {
    if (!game?.seed || !mapW || !mapH) return;
    if (ballsRef.current.seed !== game.seed) ballsRef.current = { seed: game.seed, list: makeBalls(game.seed, mapW) };
    const balls = ballsRef.current.list;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    let frame;

    const loop = () => {
      const t = serverNow();
      const g = t - game.startAt;
      if (ctx) ctx.clearRect(0, 0, mapW, mapH);

      // 맞은 뒤 3초 동안 느리게 (게임이 아니면 항상 보통 속도)
      if (speedRef) speedRef.current = g >= 0 && g < PLAY_MS && t < myHitUntilRef.current ? SLOW : 1;

      if (g > PLAY_MS) return; // 게임 끝 → 그리기 멈춤
      if (g >= 0 && ctx) {
        const me = posRef.current;
        const body = me ? bodyRect(me.x, me.y) : null;
        const safe = t < myHitUntilRef.current; // 맞은 직후 3초는 또 안 맞아요
        for (const b of balls) {
          if (hitIdsRef.current.has(b.id)) continue;
          const p = ballPos(b, g, mapH);
          if (!p) continue;
          // 떨어지는 그림자
          ctx.fillStyle = "rgba(0,0,0,0.18)";
          ctx.fillRect(p.x - b.r * 0.7, p.y + b.r * 1.3, b.r * 1.4, b.r * 0.35);
          drawBall(ctx, p.x, p.y, b.r, b.bomb);

          if (body && !safe && myId && circleHitsRect(p.x, p.y, b.r * 0.85, body)) {
            hitIdsRef.current.add(b.id);
            myHitsRef.current += 1;
            myHitUntilRef.current = t + HIT_MS;
            setNow(t);
            if (db) update(ref(db, `snowGame/players/${myId}`), { nickname, hits: myHitsRef.current, hitUntil: t + HIT_MS }).catch(() => {});
          }
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      if (speedRef) speedRef.current = 1;
      ctx?.clearRect(0, 0, mapW, mapH);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.seed, game?.startAt, mapW, mapH, myId]);

  // 참가자 위치 (나는 myPos, 친구는 others)
  const where = (id) => (id === myId ? myPos : others?.[id]);
  const entries = Object.entries(players);
  const isHit = (id, p) => (id === myId ? now < myHitUntilRef.current : (p.hitUntil ?? 0) > now);
  const survivors = entries.filter(([, p]) => !(p.hits > 0));
  const myHits = Math.max(myHitsRef.current, players[myId]?.hits ?? 0);
  const left = game ? Math.max(0, Math.ceil((game.startAt + PLAY_MS - now) / 1000)) : 0;

  // ===== 화면 위 안내 (맵 밖, 화면 고정) =====
  const hud = (
    <>
      {/* 호스트 전용: 게임 시작 버튼 (오른쪽 위 ⚙️ 아래) */}
      {isHost && phase === "idle" && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={startGame}
          className="fixed right-4 top-20 z-40 flex items-center gap-1.5 border-4 border-[#1a110e] bg-sky-200 px-3 py-1.5 text-sm font-black text-[#2b1d1a] shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] transition hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          🎮 눈덩이 게임 시작 <span className="bg-[#2b1d1a] px-1 text-[10px] text-sky-200">G</span>
        </button>
      )}

      {/* 3, 2, 1 카운트다운 */}
      {phase === "countdown" && (
        <div className="pointer-events-none fixed inset-0 z-[65] flex flex-col items-center justify-center gap-3">
          <p className="border-4 border-[#1a110e] bg-[#f5e6c8] px-4 py-1 text-lg font-black text-[#2b1d1a] shadow-[4px_4px_0_0_rgba(0,0,0,0.4)]">
            ❄️ 눈덩이 피하기 서바이벌! 방향키로 피하세요
          </p>
          <p key={Math.ceil((game.startAt - now) / 1000)} className="snow-pop text-[120px] font-black leading-none text-white [text-shadow:6px_6px_0_#1a110e]">
            {Math.max(1, Math.ceil((game.startAt - now) / 1000))}
          </p>
        </div>
      )}

      {/* 게임 중: 위쪽 가운데 타이머 */}
      {phase === "playing" && (
        <>
          {now - game.startAt < 800 && (
            <div className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center">
              <p className="snow-pop text-[90px] font-black text-amber-300 [text-shadow:6px_6px_0_#1a110e]">시작!</p>
            </div>
          )}
          <div className="pointer-events-none fixed inset-x-0 top-4 z-[45] flex justify-center px-4">
            <div className="w-72 max-w-full border-4 border-[#1a110e] bg-[#2b1d1a]/90 px-3 py-2 text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between text-sm font-black">
                <span>❄️ 눈덩이 피하기</span>
                <span className="tabular-nums text-amber-300">{left}초</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full bg-white/15">
                <div className="h-full bg-sky-300 transition-[width] duration-100" style={{ width: `${(left / (PLAY_MS / 1000)) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-xs font-bold text-white/80">
                {players[myId] || myHits > 0
                  ? myHits === 0
                    ? "✨ 아직 한 번도 안 맞았어요!"
                    : `💥 ${myHits}번 맞았어요!`
                  : "👀 구경 중"}
                <span className="float-right">생존 {survivors.length}/{entries.length}</span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* 결과 */}
      {phase === "result" && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-[65] flex justify-center px-4">
          <div className="snow-pop max-w-md border-4 border-[#1a110e] bg-[#f5e6c8] px-5 py-3 text-center text-[#2b1d1a] shadow-[6px_6px_0_0_rgba(0,0,0,0.4)]">
            <p className="text-xl font-black">🎉 게임 끝!</p>
            {survivors.length > 0 ? (
              <p className="mt-1 text-base font-bold">
                🏆 생존자: {survivors.map(([, p]) => p.nickname || "손님").join(", ")}
              </p>
            ) : (
              <p className="mt-1 text-base font-bold">☃️ 이번엔 모두 눈덩이를 맞았어요!</p>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <style>{`
        @keyframes snow-pop { 0% { transform: scale(0.3); opacity: 0 } 60% { transform: scale(1.15); opacity: 1 } 100% { transform: scale(1) } }
        .snow-pop { animation: snow-pop 0.35s ease-out both; }
        @keyframes snow-ouch { 0% { transform: translateY(8px) scale(0.4); opacity: 0 } 25% { transform: translateY(-4px) scale(1.15); opacity: 1 } 40%,100% { transform: translateY(0) scale(1); opacity: 1 } }
        .snow-ouch { animation: snow-ouch 0.5s ease-out both; }
        @keyframes snow-confetti {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          35%  { transform: translate(calc(var(--dx) * 0.6), var(--up)) rotate(calc(var(--rot) * 0.4)); opacity: 1; }
          100% { transform: translate(var(--dx), var(--fall)) rotate(var(--rot)); opacity: 0; }
        }
        .snow-confetti { animation: snow-confetti 1.8s cubic-bezier(.2,.7,.4,1) 3 both; }
      `}</style>

      {/* 떨어지는 눈덩이 (맵 위, 클릭을 막지 않아요) */}
      <canvas
        ref={canvasRef}
        width={mapW}
        height={mapH}
        className="pointer-events-none absolute left-0 top-0 z-20"
        style={{ width: mapW, height: mapH, imageRendering: "pixelated" }}
      />

      {/* 맞은 사람: 꽁꽁 언 표시 + 머리 위 "앗!" */}
      {phase === "playing" &&
        entries.map(([id, p]) => {
          const pos = where(id);
          if (!pos || !isHit(id, p)) return null;
          return (
            <div key={`ouch-${id}-${p.hits}`} className="pointer-events-none absolute z-20" style={{ left: pos.x, top: pos.y, width: AVATAR_WIDTH, height: AVATAR_HEIGHT }}>
              <div className="absolute inset-x-6 bottom-0 top-4 animate-pulse rounded-lg bg-sky-200/35 ring-4 ring-sky-200/70" />
              <div className="absolute -top-[92px] left-1/2 flex w-0 justify-center">
                <div className="snow-ouch relative shrink-0 border-4 border-[#1a110e] bg-white px-3 py-0.5 text-2xl font-black text-rose-600 shadow-[3px_3px_0_0_rgba(0,0,0,0.35)]">
                  앗!
                  <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[8px] border-t-[8px] border-x-transparent border-t-[#1a110e]" />
                </div>
              </div>
            </div>
          );
        })}

      {/* 결과: 생존자 머리 위 폭죽 + 🏆 */}
      {phase === "result" &&
        survivors.map(([id]) => {
          const pos = where(id);
          if (!pos) return null;
          return (
            <div key={`win-${id}`} className="pointer-events-none absolute z-20" style={{ left: pos.x + AVATAR_WIDTH / 2, top: pos.y - 70 }}>
              <Confetti seed={(game?.seed ?? 1) + id.length * 97 + id.charCodeAt(0)} />
              <div className="absolute -top-14 left-0 flex w-0 justify-center">
                <span className="snow-pop shrink-0 whitespace-nowrap border-4 border-[#1a110e] bg-amber-300 px-2 py-0.5 text-base font-black text-[#2b1d1a] shadow-[3px_3px_0_0_rgba(0,0,0,0.35)]">
                  🏆 생존!
                </span>
              </div>
            </div>
          );
        })}

      {mounted && createPortal(hud, document.body)}
    </>
  );
}
