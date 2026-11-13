'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PIXEL_CORNERS } from './PixelModal';

const SIZE = 64; // 버튼 높이 (맵 기준 px)

// 가까이 가면 물건 위에 톡 튀어나오는 픽셀 버튼 [🔍 올해의 책]
//  - icon: 앞의 아이콘 (기본 🔍) / text: 물건 이름
//  - 클릭하거나 E키를 누르면 상세 창이 열려요 (E키는 page.js에서 처리)
//  - target: 버튼을 띄울 물건의 위치 { x, y, width, height } (맵 좌표)
export default function InteractButton({
  target,
  onClick,
  icon = '🔍',
  text = '',
}) {
  const label = text || '살펴보기';

  return (
    <AnimatePresence>
      {target && (
        // 바깥 칸: 물건 가운데 위에 고정 (버튼 너비가 달라도 항상 가운데 정렬)
        <div
          key={`${target.x}-${target.y}`}
          className="absolute z-20 flex w-0 justify-center"
          style={{
            left: target.x + target.width / 2,
            top: Math.max(8, target.y - SIZE - 10),
          }}
        >
          <motion.button
            type="button"
            onClick={onClick}
            aria-label={`${label} (E키)`}
            title={`${label} (E키)`}
            className="flex shrink-0 flex-col items-center outline-none"
            initial={{ opacity: 0, scale: 0.3, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 12 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
          >
            {/* 도트 테두리 말풍선 */}
            <span
              className="flex items-center justify-center bg-[#2b1d1a] p-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]"
              style={{ height: SIZE, minWidth: SIZE, clipPath: PIXEL_CORNERS }}
            >
              <span
                className="relative flex h-full items-center justify-center gap-2 whitespace-nowrap bg-[#f5e6c8] pl-3 pr-8 leading-none"
                style={{ minWidth: SIZE - 8, clipPath: PIXEL_CORNERS }}
              >
                <span className="text-[30px]">{icon}</span>
                {text && (
                  <span className="text-2xl font-black text-[#2b1d1a]">
                    {text}
                  </span>
                )}
                {/* E키 안내 */}
                <span className="absolute bottom-0.5 right-1 bg-[#2b1d1a] px-1 text-[11px] font-black leading-4 text-amber-200">
                  E
                </span>
              </span>
            </span>
            {/* 말풍선 꼬리 (계단 모양) */}
            <span className="h-2 w-5 bg-[#2b1d1a]" />
            <span className="h-1.5 w-2 bg-[#2b1d1a]" />
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
