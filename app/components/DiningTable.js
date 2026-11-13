'use client';

import { useRef } from 'react';
import { partyData } from '../data';
import { FOOD_SPOTS } from '../lib/mapConfig';
import PixelModal from './PixelModal';
import MapImage from './MapImage';

// 그림이 아직 없을 때 보여줄 임시 음식 (흰 접시 + 이모지)
function PlateFallback({ emoji }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex aspect-square h-full max-h-full items-center justify-center rounded-full border-4 border-[#d6c7b0] bg-[#fdf8ef] text-5xl shadow-[0_6px_0_0_rgba(0,0,0,0.2)]">
        {emoji}
      </div>
    </div>
  );
}

// 음식 위로 피어오르는 김
function Steam() {
  return (
    <div className="pointer-events-none absolute -top-12 left-1/2 h-14 w-16 -translate-x-1/2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="steam-puff absolute bottom-0 h-7 w-4 rounded-full bg-white/80 blur-[3px]"
          style={{ left: `${8 + i * 16}px`, animationDelay: `${i * 0.7}s` }}
        />
      ))}
    </div>
  );
}

// 식탁 위 음식들 (data.js의 image 그림) + 김
// openFoodId: 지금 상세 창이 열린 음식 id (예: "pizza") / onClose: 창 닫기
export default function DiningTable({
  mapW,
  mapH,
  openFoodId,
  onOpenFood,
  onClose,
}) {
  const foods = partyData?.foods ?? [];
  const openFood = foods.find((f) => f.id === openFoodId);
  const shownFood = useRef(null); // 창이 닫히는 동안에도 내용이 보이도록 마지막 음식 기억
  if (openFood) shownFood.current = openFood;
  const shown = shownFood.current;
  const toPx = (s) => ({
    left: s.x * mapW,
    top: s.y * mapH,
    width: s.w * mapW,
    height: s.h * mapH,
  });

  return (
    <>
      <style>{`
        @keyframes steam-rise {
          0%   { transform: translate(0, 0) scale(0.6);       opacity: 0; }
          20%  {                                                opacity: 0.7; }
          50%  { transform: translate(-5px, -22px) scale(1);   }
          100% { transform: translate(5px, -46px) scale(1.5);  opacity: 0; }
        }
        .steam-puff { animation: steam-rise 2.1s ease-out infinite; }
      `}</style>

      {/* 음식 그림 + 김 (그림은 mapConfig.js의 FOOD_SPOTS 네모 안에 맞춰져요) */}
      {foods.map((food) => {
        const spot = FOOD_SPOTS[food.id];
        if (!spot) return null; // 좌표가 없는 음식은 표시 안 함
        const r = toPx(spot);
        return (
          <div key={food.id}>
            <MapImage
              src={food.image}
              alt={food.name}
              x={r.left}
              y={r.top}
              width={r.width}
              height={r.height}
              fallback={<PlateFallback emoji={food.emoji} />}
            />
            <div className="pointer-events-none absolute" style={r}>
              <Steam />
            </div>
            {/* 클릭 영역: 마우스를 올리면 노랗게 빛나고 이름표가 떠요 */}
            <button
              type="button"
              onClick={() => onOpenFood?.(food.id)}
              aria-label={`${food.name} 설명 보기`}
              className="group absolute rounded-full outline-none transition hover:bg-amber-200/15 hover:shadow-[0_0_0_5px_rgba(253,230,138,0.9),0_0_28px_rgba(253,230,138,0.7)] focus-visible:shadow-[0_0_0_5px_rgba(253,230,138,0.9)]"
              style={r}
            >
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap border-4 border-[#1a110e] bg-[#f5e6c8] px-3 py-1 text-xl font-black text-[#2b1d1a] opacity-0 shadow-[4px_4px_0_0_rgba(0,0,0,0.35)] transition group-hover:opacity-100">
                🔍 {food.emoji} {food.name}
              </span>
            </button>
          </div>
        );
      })}

      {/* 🔍(또는 E키)를 누르면 열리는 음식 설명 창 */}
      <PixelModal
        open={!!openFood}
        onClose={onClose}
        label="🍽️ 오늘의 메뉴"
        title={shown ? `${shown.emoji} ${shown.name}` : ''}
        width={440}
      >
        {shown && (
          <p className="text-lg leading-relaxed text-amber-50/90">
            {shown.description}
          </p>
        )}
      </PixelModal>
    </>
  );
}
