'use client';

import { AnimatePresence } from 'framer-motion';
import EmoteBubble from './EmoteBubble';
import ChatBubble from './ChatBubble';
import EatingFx from './EatingFx';
import PixelCharacter from './PixelCharacter';
import { GRID_W, GRID_H } from '../lib/pixelCharacter';

// 캐릭터 크기: 18x25 도트를 몇 배로 키울지 (예전 4 → 지금 7, 약 1.75배)
//  - 정수(5, 6, 7, 8...)로 해야 도트가 또렷해요
export const AVATAR_SCALE = 7;
export const AVATAR_WIDTH = GRID_W * AVATAR_SCALE; // 126
export const AVATAR_HEIGHT = GRID_H * AVATAR_SCALE; // 175

// 앉았을 때: 다리(아래 5줄)는 의자·식탁에 가려진 것처럼 숨기고, 몸을 그만큼 내려서 엉덩이를 의자에 붙여요
const SIT_ROWS = 20; // 보이는 줄 수 (25줄 중 위 20줄)
const SIT_H = SIT_ROWS * AVATAR_SCALE; // 보이는 높이
const SIT_DROP = AVATAR_HEIGHT - SIT_H; // 내려가는 만큼

// 픽셀아트 캐릭터 + 닉네임 + 표정 말풍선 + 채팅 말풍선 (+ 앉아서 냠냠)
// dir: "down" | "up" | "left" | "right"
export default function Avatar({
  nickname,
  x,
  y,
  isMoving,
  dir = 'down',
  look,
  smooth = false,
  emote = null,
  chat = null,
  sitting = false,
  isMe = false,
}) {
  const cheering = emote?.type === 'toast'; // 건배 중이면 잔을 번쩍 드는 포즈

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-10"
      style={{
        width: AVATAR_WIDTH,
        height: AVATAR_HEIGHT,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        transition: smooth ? 'transform 0.12s linear' : 'none',
      }}
    >
      {/* 안쪽 전체: 앉으면 SIT_DROP만큼 아래로 (닉네임·말풍선도 머리를 따라 같이 내려가요) */}
      <div
        className="absolute inset-0"
        style={{ transform: sitting ? `translateY(${SIT_DROP}px)` : undefined }}
      >
        {/* 표정/건배 말풍선 (3초) */}
        <AnimatePresence>
          {emote && (
            <EmoteBubble key={emote.id ?? emote.type} type={emote.type} />
          )}
        </AnimatePresence>

        {/* 채팅 말풍선 (5초) — chat = { text, key } */}
        <AnimatePresence>
          {chat && (
            <ChatBubble key={chat.key} text={chat.text} raised={!!emote} />
          )}
        </AnimatePresence>

        {/* 닉네임 (내 캐릭터는 노란 테두리) */}
        <div
          className={`absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/80 px-3 py-1 text-sm font-bold text-white shadow-lg ring-1 ${
            isMe ? 'ring-amber-300' : 'ring-white/20'
          }`}
        >
          {nickname}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-slate-900/80" />
        </div>

        {/* 바닥 그림자 (앉아 있을 때는 숨김) */}
        {!sitting && (
          <div className="absolute bottom-0 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full bg-black/30" />
        )}

        {/* 캐릭터 (앉아 있으면 위 20줄만 보여줘요) */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={
            sitting
              ? { top: 0, height: SIT_H, overflow: 'hidden' }
              : { bottom: 0 }
          }
          aria-label={`${nickname}의 캐릭터`}
        >
          <PixelCharacter
            look={look}
            dir={dir}
            moving={isMoving && !cheering && !sitting}
            cheering={cheering}
            scale={AVATAR_SCALE}
          />
        </div>

        {/* 앉아서 냠냠 (음식이 바라보는 쪽에서 통통) */}
        {sitting && !cheering && (
          <EatingFx side={dir === 'left' ? 'left' : 'right'} />
        )}
      </div>
    </div>
  );
}
