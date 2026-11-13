'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PIXEL_CORNERS } from './PixelModal';

export const CHAT_MAX = 60; // 말풍선에 들어갈 최대 글자 수

// 화면 하단 중앙의 작은 픽셀 채팅 입력창
//  - Enter: 보내고 닫기 / ESC 또는 다른 곳 클릭: 그냥 닫기
export default function ChatInput({ open, onSend, onClose }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  // 열리면 바로 입력할 수 있게
  useEffect(() => {
    if (open) {
      setText('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const onKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return; // 한글 조합 중 Enter는 무시 (마지막 글자 중복 방지)
    if (e.key === 'Enter') {
      e.preventDefault();
      const body = text.trim();
      if (body) onSend(body.slice(0, CHAT_MAX));
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        // 바깥 칸: 화면 하단 가운데 고정 / 안쪽: 톡 올라오는 애니메이션
        <div
          key="chat-input"
          className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center"
        >
          <motion.div
            className="pointer-events-auto w-[min(90vw,420px)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
          >
            <div
              className="bg-[#1a110e] p-1 shadow-[6px_6px_0_0_rgba(0,0,0,0.35)]"
              style={{ clipPath: PIXEL_CORNERS }}
            >
              <div
                className="flex items-center gap-2 bg-[#f5e6c8] px-3 py-2"
                style={{ clipPath: PIXEL_CORNERS }}
              >
                <span className="text-xl leading-none">💬</span>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={onClose}
                  maxLength={CHAT_MAX}
                  placeholder="말풍선으로 할 말을 입력하세요"
                  aria-label="말풍선 채팅 입력"
                  className="min-w-0 flex-1 bg-transparent text-base font-bold text-[#2b1d1a] outline-none placeholder:font-normal placeholder:text-[#2b1d1a]/40"
                />
                <span className="shrink-0 text-[11px] tabular-nums text-[#5b3b2a]/70">
                  {text.length}/{CHAT_MAX}
                </span>
              </div>
            </div>
            <p className="mt-1.5 text-center text-[11px] font-bold text-white/70 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
              Enter 보내기 · ESC 취소
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
