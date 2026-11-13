'use client';

import { useEffect, useState } from 'react';
import {
  spriteUrl,
  normalizeLook,
  GRID_W,
  GRID_H,
} from '../lib/pixelCharacter';

const WALK_SEQUENCE = [0, 1, 2, 1]; // 걷기 3프레임 (왼발-제자리-오른발-제자리)
const WALK_MS = 140; // 걷기 프레임 간격
const CHEER_MS = 260; // 건배 포즈 프레임 간격

// dir: "down"(앞) | "up"(뒤) | "left" | "right"(옆)
export default function PixelCharacter({
  look,
  dir = 'down',
  moving = false,
  cheering = false,
  scale = 4,
  className = '',
}) {
  const [tick, setTick] = useState(0);

  // 움직이거나 건배할 때만 프레임을 넘기고, 멈추면 바로 제자리 프레임으로
  useEffect(() => {
    if (!moving && !cheering) {
      setTick(0);
      return;
    }
    const id = setInterval(
      () => setTick((t) => t + 1),
      cheering ? CHEER_MS : WALK_MS
    );
    return () => clearInterval(id);
  }, [moving, cheering]);

  const view = dir === 'up' ? 'back' : dir === 'down' ? 'front' : 'side';
  const pose = cheering ? 'cheer' : 'walk';
  const frame = cheering ? tick % 2 : moving ? WALK_SEQUENCE[tick % 4] : 1;
  const src = spriteUrl(normalizeLook(look), view, frame, pose);

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      width={GRID_W * scale}
      height={GRID_H * scale}
      className={className}
      style={{
        width: GRID_W * scale,
        height: GRID_H * scale,
        maxWidth: 'none', // Tailwind 기본 설정(img 최대 너비 100%) 때문에 작아지지 않게
        imageRendering: 'pixelated',
        transform: !cheering && dir === 'left' ? 'scaleX(-1)' : undefined, // 왼쪽은 옆모습을 뒤집어서
      }}
    />
  );
}
