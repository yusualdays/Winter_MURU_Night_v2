'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// 가까이 가면 화면 아래쪽 가운데에 스르륵 나타나는 설명 창 (배경을 가리지 않아요)
export default function ProximityPanel({
  open,
  onClose,
  children,
  className = '',
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`fixed bottom-24 left-1/2 z-50 max-h-[65vh] w-[min(92vw,560px)] -translate-x-1/2 overflow-y-auto rounded-2xl p-5 text-white shadow-2xl ${className}`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-2 px-2 text-2xl leading-none text-white/50 hover:text-white"
            aria-label="닫기"
          >
            ×
          </button>
          {children}
          <p className="mt-3 text-center text-[11px] text-white/40">
            멀어지면 자동으로 닫혀요
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
