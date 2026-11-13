'use client';

// 배경 그림 위의 "투명한 클릭 영역" — 마우스를 올리면 빛나고 이름표가 보여요
export default function Hotspot({
  x,
  y,
  width,
  height,
  label,
  onClick,
  rounded = 'rounded-xl',
  ariaLabel,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={`group absolute ${rounded} outline-none transition hover:bg-amber-100/10 hover:ring-4 hover:ring-amber-200/80 focus-visible:ring-4 focus-visible:ring-amber-200`}
      style={{ left: x, top: y, width, height }}
    >
      {children}
      {label && (
        <span className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/90 px-4 py-1.5 text-xl font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
          {label}
        </span>
      )}
    </button>
  );
}
