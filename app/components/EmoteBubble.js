'use client';

import { motion } from 'framer-motion';

// ===== 픽셀아트 이모지 =====
// 글자 하나 = 픽셀 하나. 글자마다 색을 정해 둬요 (. 은 빈칸)
const PALETTE = {
  Y: '#facc15', // 노랑 (얼굴)
  O: '#f59e0b', // 진한 노랑 (그림자)
  K: '#1e293b', // 검정 (눈, 입)
  P: '#fb7185', // 분홍 (볼)
  R: '#ef4444', // 빨강 (하트)
  D: '#b91c1c', // 진한 빨강
  W: '#ffffff', // 흰색 (반짝임)
  S: '#fcd9b6', // 살색 (손)
  B: '#3b82f6', // 파랑 (옷)
};

export const EMOTES = {
  smile: {
    label: '웃기',
    pixels: [
      '..YYYYY..',
      '.YYYYYYY.',
      'YYKYYYKYY',
      'YYKYYYKYY',
      'YPYYYYYPY',
      'YKYYYYYKY',
      'YYKKKKKYY',
      '.OYYYYYO.',
      '..OOOOO..',
    ],
  },
  heart: {
    label: '하트 뿅뿅',
    pixels: [
      '.RR...RR.',
      'RWRR.RRRR',
      'RWRRRRRRR',
      'RRRRRRRRR',
      'RRRRRRRRD',
      '.RRRRRRD.',
      '..RRRRD..',
      '...RRD...',
      '....D....',
    ],
  },
  hurray: {
    label: '만세',
    pixels: [
      'S.......S',
      'S..YYY..S',
      '.S.YKY.S.',
      '.SYYYYYS.',
      '..BYKYB..',
      '...BBB...',
      '...BBB...',
      '...B.B...',
      '..BB.BB..',
    ],
  },
  toast: {
    label: '건배',
    emoji: '🥂', // 건배는 이모지로
  },
};

// 숫자키 → 이모지 종류
export const EMOTE_KEYS = {
  Digit1: 'smile',
  Digit2: 'heart',
  Digit3: 'hurray',
  Numpad1: 'smile',
  Numpad2: 'heart',
  Numpad3: 'hurray',
  KeyT: 'toast', // T키 = 건배 포즈
};

function PixelIcon({ pixels, size = 40 }) {
  const rows = pixels.length;
  const cols = pixels[0].length;
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
    >
      {pixels.flatMap((row, y) =>
        [...row].map((ch, x) =>
          PALETTE[ch] ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={PALETTE[ch]}
            />
          ) : null
        )
      )}
    </svg>
  );
}

// 아바타 머리 위에 3초 동안 떠오르는 픽셀 말풍선
export default function EmoteBubble({ type }) {
  const emote = EMOTES[type];
  if (!emote) return null;

  return (
    <motion.div
      className="pointer-events-none absolute -top-[92px] left-1/2 z-20 -ml-[30px]"
      initial={{ opacity: 0, y: 14, scale: 0.4 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    >
      {/* 픽셀 느낌 말풍선: 둥근 모서리 없이 두꺼운 테두리 */}
      <div className="relative border-4 border-slate-900 bg-white p-1 shadow-[4px_4px_0_0_rgba(15,23,42,0.6)]">
        <motion.div
          animate={
            type === 'hurray'
              ? { y: [0, -6, 0] }
              : type === 'heart'
              ? { scale: [1, 1.15, 1] }
              : { rotate: [0, -8, 8, 0] }
          }
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          {emote.pixels ? (
            <PixelIcon pixels={emote.pixels} />
          ) : (
            <span className="block h-10 w-10 text-center text-[32px] leading-10">
              {emote.emoji}
            </span>
          )}
        </motion.div>
        {/* 말풍선 꼬리 (계단 모양) */}
        <span className="absolute -bottom-[12px] left-1/2 h-2 w-4 -translate-x-1/2 bg-slate-900" />
        <span className="absolute -bottom-[8px] left-1/2 h-1 w-2 -translate-x-1/2 bg-white" />
      </div>

      {/* 하트 뿅뿅: 작은 하트들이 위로 퐁퐁 */}
      {type === 'heart' &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute top-0"
            style={{ left: 8 + i * 18 }}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -40, opacity: 0 }}
            transition={{ duration: 1.2, delay: i * 0.3, repeat: Infinity }}
          >
            <PixelIcon pixels={EMOTES.heart.pixels} size={14} />
          </motion.span>
        ))}
    </motion.div>
  );
}
