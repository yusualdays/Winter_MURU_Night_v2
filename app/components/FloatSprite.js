'use client';

import { motion } from 'framer-motion';
import { BACKGROUND_SRC } from '../lib/mapConfig';

// 배경 그림의 한 부분(음식, 포스터, 책꽂이)을 오려서 둥둥 띄우기
// active(가까이 왔을 때)면 멈추고 노랗게 빛나요
export default function FloatSprite({
  x,
  y,
  width,
  height,
  mapW,
  mapH,
  active,
  rounded = 'rounded-xl',
  amplitude = 5,
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${rounded} transition-shadow duration-300 ${
        active
          ? 'shadow-[0_0_0_4px_rgba(253,230,138,0.9),0_0_30px_rgba(253,230,138,0.7)]'
          : 'shadow-[0_8px_10px_-6px_rgba(0,0,0,0.45)]'
      }`}
      style={{
        left: x,
        top: y,
        width,
        height,
        backgroundImage: `url(${BACKGROUND_SRC})`,
        backgroundSize: `${mapW}px ${mapH}px`,
        backgroundPosition: `-${x}px -${y}px`,
        imageRendering: 'pixelated',
      }}
      animate={active ? { y: -amplitude * 1.6 } : { y: [0, -amplitude, 0] }}
      transition={
        active
          ? { duration: 0.3, ease: 'easeOut' }
          : {
              duration: 2.4,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: (x % 7) * 0.15,
            }
      }
    />
  );
}
