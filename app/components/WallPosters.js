'use client';

import { partyData } from '../data';
import { POSTER_SPOTS } from '../lib/mapConfig';
import MapImage from './MapImage';

// 벽에 걸린 영화 포스터 3장
//  - data.js movies의 앞 3개 poster 이미지를 왼쪽부터 걸어요
//  - 이미지가 아직 없으면 색깔 + 이모지로 임시 포스터를 보여줘요
export default function WallPosters({ mapW, mapH }) {
  const movies = (partyData?.movies ?? []).slice(0, POSTER_SPOTS.length);

  return (
    <>
      {movies.map((movie, i) => {
        const s = POSTER_SPOTS[i];
        return (
          <MapImage
            key={movie.id ?? i}
            src={movie.poster}
            alt={movie.title}
            x={s.x * mapW}
            y={s.y * mapH}
            width={s.w * mapW}
            height={s.h * mapH}
            className="border-[6px] border-[#3b2a20] bg-[#3b2a20] shadow-[4px_6px_0_0_rgba(0,0,0,0.25)]"
            fallback={
              <div
                className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center"
                style={{
                  backgroundColor: movie.color ?? '#334155',
                  backgroundImage:
                    'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55))',
                }}
              >
                <span className="text-4xl">{movie.emoji ?? '🎬'}</span>
                <span className="text-sm font-bold leading-tight text-white">
                  {movie.title}
                </span>
              </div>
            }
          />
        );
      })}
    </>
  );
}
