'use client';

import { useEffect, useState } from 'react';
import { partyData } from '../data';

// 앉아 있는 동안 아바타 옆에서 통통 튀는 "냠냠" 애니메이션
//  - 식탁 음식 이모지가 번갈아 바뀌고, 🍽️ 접시와 "냠냠" 글자가 함께 통통 튀어요
//  - side: 이모지가 놓일 쪽 ("left" | "right")
export default function EatingFx({ side = 'right' }) {
  const foods = (partyData?.foods ?? []).map((f) => f.emoji).filter(Boolean);
  const list = foods.length ? foods : ['🍕', '🍗', '🍝'];
  const [i, setI] = useState(0);

  // 1.2초마다 다른 음식으로
  useEffect(() => {
    const id = setInterval(() => setI((n) => n + 1), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="pointer-events-none absolute -top-2 z-20 flex flex-col items-center"
      style={side === 'right' ? { left: '80%' } : { right: '80%' }}
    >
      <style>{`
        @keyframes nyam-bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
        @keyframes nyam-text { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-4px) scale(1.1) } }
        .nyam-bounce { animation: nyam-bounce 0.6s steps(3, jump-none) infinite; }
        .nyam-text { animation: nyam-text 0.6s steps(2, jump-none) infinite; }
      `}</style>
      {/* 냠냠 글자 (픽셀 말풍선 느낌) */}
      <span className="nyam-text mb-1 border-[3px] border-slate-900 bg-white px-2 text-lg font-black leading-6 text-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,0.5)]">
        냠냠
      </span>
      {/* 통통 튀는 음식 */}
      <span
        key={i}
        className="nyam-bounce text-6xl leading-none drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]"
      >
        {list[i % list.length]}
      </span>
      {/* 접시 */}
      <span className="-mt-2 text-5xl leading-none">🍽️</span>
    </div>
  );
}
