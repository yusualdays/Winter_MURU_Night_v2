'use client';

import { motion } from 'framer-motion';

// 아바타 머리 위에 뜨는 흰색 픽셀 말풍선 (5초 뒤 스르륵 사라짐 — 사라지는 시점은 page.js에서 정해요)
//  - raised: 표정 말풍선(1·2·3·T)이 같이 떠 있으면 그 위로 올라가요
export default function ChatBubble({ text, raised = false }) {
  return (
    // 바깥 칸: 머리 위 가운데에 고정 / 안쪽: 떠오르고 사라지는 애니메이션
    <div
      className="pointer-events-none absolute left-1/2 z-30 flex w-0 justify-center"
      style={{ bottom: `calc(100% + ${raised ? 104 : 46}px)` }}
    >
      <motion.div
        className="flex w-max max-w-[260px] shrink-0 flex-col items-center"
        initial={{ opacity: 0, y: 8, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* 몸통: 두꺼운 검정 테두리 + 계단 모서리 */}
        <div className="bg-slate-900 p-[4px]" style={{ clipPath: CORNERS }}>
          <p
            className="whitespace-pre-wrap break-words bg-white px-3 py-1.5 text-center text-lg font-bold leading-snug text-slate-900"
            style={{
              clipPath: CORNERS,
              wordBreak: 'keep-all',
              overflowWrap: 'anywhere',
            }}
          >
            {text}
          </p>
        </div>
        {/* 꼬리 (계단 모양) */}
        <span className="-mt-[1px] h-[6px] w-5 bg-slate-900" />
        <span className="relative -mt-[6px] h-[3px] w-3 bg-white" />
        <span className="h-[5px] w-2 bg-slate-900" />
      </motion.div>
    </div>
  );
}

// 4px 계단 모서리
const CORNERS =
  'polygon(0 4px, 4px 4px, 4px 0, calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px))';
