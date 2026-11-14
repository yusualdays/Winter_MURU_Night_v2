"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AVATAR_WIDTH } from "./Avatar";

// 가까이 있는 친구 머리 위에 뜨는 [🤝 인사하기] [🔍 프로필] 버튼 (맵 위)
//  - user: { id, x, y, nickname } (가까운 친구가 없으면 null)
export default function UserActions({ user, onGreet, onProfile, greetDisabled = false }) {
  return (
    <AnimatePresence>
      {user && (
        // 바깥 칸: 친구 머리 위 가운데에 고정 / 안쪽: 톡 튀어나오는 애니메이션
        <div
          key={user.id}
          className="absolute z-30 flex w-0 justify-center"
          style={{ left: user.x + AVATAR_WIDTH / 2, top: user.y - 160 }}
        >
          <motion.div
            className="flex shrink-0 gap-2"
            initial={{ opacity: 0, scale: 0.4, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.4, y: 10 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
          >
            <button
              type="button"
              onClick={onGreet}
              disabled={greetDisabled}
              aria-label={`${user.nickname}님에게 인사하기`}
              className="whitespace-nowrap border-4 border-[#1a110e] bg-amber-300 px-3 py-1.5 text-xl font-black text-[#2b1d1a] shadow-[4px_4px_0_0_rgba(0,0,0,0.35)] transition hover:bg-amber-200 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
            >
              🤝 인사하기
            </button>
            <button
              type="button"
              onClick={onProfile}
              aria-label={`${user.nickname}님 프로필 보기`}
              className="whitespace-nowrap border-4 border-[#1a110e] bg-[#f5e6c8] px-3 py-1.5 text-xl font-black text-[#2b1d1a] shadow-[4px_4px_0_0_rgba(0,0,0,0.35)] transition hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              🔍 프로필
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
