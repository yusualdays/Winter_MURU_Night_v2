'use client';

import { useState } from 'react';

// 맵 위에 올리는 그림 한 장 (음식, 포스터, 트리 등)
//  - src: 그림 주소 (예: "/foods/pizza.png")
//  - x, y, width, height: 맵 위 위치와 크기 (그림은 비율을 지키며 이 네모 안에 쏙 맞춰져요)
//  - fallback: 그림이 없거나 못 불러왔을 때 대신 보여줄 것
export default function MapImage({
  src,
  alt = '',
  x,
  y,
  width,
  height,
  fallback = null,
  className = '',
  style,
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = !src || failedSrc === src;

  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{ left: x, top: y, width, height, ...style }}
    >
      {failed ? (
        fallback
      ) : (
        <img
          src={src}
          alt={alt}
          draggable={false}
          onError={() => setFailedSrc(src)}
          style={{
            width: '100%',
            height: '100%',
            maxWidth: 'none',
            objectFit: 'contain',
            imageRendering: 'pixelated', // 도트 그림을 또렷하게
          }}
        />
      )}
    </div>
  );
}
