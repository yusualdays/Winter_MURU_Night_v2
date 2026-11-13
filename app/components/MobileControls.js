'use client';

import { useRef, useState } from 'react';

// 휴대폰·태블릿용 화면 조작 버튼 (PC에서는 안 보여요)
//  - 왼쪽: 방향 패드 — 누른 채로 손가락을 움직이면 8방향(대각선 포함)으로 걸어요
//  - 오른쪽 옆: 행동 버튼 = PC의 E키 (가까운 물건 보기 / 앉기 / 일어나기)
//
//  onDirs(["up","left"]) : 지금 눌린 방향들 (손을 떼면 [])
//  onAction()            : 행동 버튼을 눌렀을 때
//  actionIcon            : 행동 버튼에 보일 아이콘 (가까운 물건이 없으면 null → 흐리게)

const PAD = 132; // 방향 패드 크기 (px)
const DEADZONE = 14; // 가운데에서 이만큼은 안 움직여요

// 손가락 위치 → 방향들
function dirsFrom(dx, dy) {
  if (Math.hypot(dx, dy) < DEADZONE) return [];
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // 오른쪽 0°, 아래 90°
  const sector = Math.round(angle / 45); // -4 ~ 4 (8방향)
  return {
    0: ['right'],
    1: ['right', 'down'],
    2: ['down'],
    3: ['left', 'down'],
    4: ['left'],
    '-4': ['left'],
    '-3': ['left', 'up'],
    '-2': ['up'],
    '-1': ['right', 'up'],
  }[sector];
}

// 도트 화살표 하나
function Arrow({ rotate, active }) {
  return (
    <svg
      viewBox="0 0 5 3"
      width="26"
      height="16"
      shapeRendering="crispEdges"
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="0"
        width="1"
        height="1"
        fill={active ? '#2b1d1a' : '#f5e6c8'}
      />
      <rect
        x="1"
        y="1"
        width="3"
        height="1"
        fill={active ? '#2b1d1a' : '#f5e6c8'}
      />
      <rect
        x="0"
        y="2"
        width="5"
        height="1"
        fill={active ? '#2b1d1a' : '#f5e6c8'}
      />
    </svg>
  );
}

export default function MobileControls({ onDirs, onAction, actionIcon }) {
  const padRef = useRef(null);
  const [dirs, setDirs] = useState([]);

  const update = (e) => {
    const rect = padRef.current.getBoundingClientRect();
    const next = dirsFrom(
      e.clientX - (rect.left + rect.width / 2),
      e.clientY - (rect.top + rect.height / 2)
    );
    setDirs(next);
    onDirs(next);
  };
  const release = () => {
    setDirs([]);
    onDirs([]);
  };

  const on = (d) => dirs.includes(d);
  const cell = (d) =>
    `flex items-center justify-center ${
      on(d) ? 'bg-amber-400' : 'bg-[#6e4833]'
    }`;

  return (
    <div
      className="pointer-events-none fixed bottom-24 left-4 z-40 flex select-none items-end gap-4"
      style={{ WebkitTouchCallout: 'none' }}
    >
      {/* 방향 패드 (십자 모양) */}
      <div
        ref={padRef}
        role="group"
        aria-label="방향 패드"
        className="pointer-events-auto relative grid grid-cols-3 grid-rows-3 opacity-90"
        style={{ width: PAD, height: PAD, touchAction: 'none' }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          update(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span />
        <span className={`${cell('up')} border-4 border-b-0 border-[#1a110e]`}>
          <Arrow rotate={0} active={on('up')} />
        </span>
        <span />
        <span
          className={`${cell('left')} border-4 border-r-0 border-[#1a110e]`}
        >
          <Arrow rotate={-90} active={on('left')} />
        </span>
        <span className="bg-[#6e4833] border-y-4 border-[#1a110e]" />
        <span
          className={`${cell('right')} border-4 border-l-0 border-[#1a110e]`}
        >
          <Arrow rotate={90} active={on('right')} />
        </span>
        <span />
        <span
          className={`${cell('down')} border-4 border-t-0 border-[#1a110e]`}
        >
          <Arrow rotate={180} active={on('down')} />
        </span>
        <span />
      </div>

      {/* 행동 버튼 (= E키) */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault(); // 버튼에 포커스가 남지 않게
          onAction();
        }}
        aria-label="행동 (E키)"
        className={`pointer-events-auto mb-2 flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 border-[#1a110e] shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
          actionIcon ? 'bg-amber-400' : 'bg-[#f5e6c8]/60'
        }`}
        style={{ touchAction: 'manipulation' }}
      >
        <span className="text-2xl leading-none">{actionIcon ?? '✋'}</span>
        <span className="text-[10px] font-black text-[#2b1d1a]">E</span>
      </button>
    </div>
  );
}
