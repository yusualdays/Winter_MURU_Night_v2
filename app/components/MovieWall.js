'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { partyData } from '../data';
import PixelModal from './PixelModal';
import { useFriendPicks, RecommendForm, FriendHeader } from './FriendPicks';

// 클릭하면 3D로 뒤집히는 영화 카드
function MovieCard({ movie }) {
  const [flipped, setFlipped] = useState(false);
  const [imgFailed, setImgFailed] = useState(false); // 포스터 그림을 못 불러오면 임시 포스터로

  return (
    <div className="aspect-[2/3] w-full" style={{ perspective: 1000 }}>
      <motion.button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="relative h-full w-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        aria-label={`${movie.title} 카드 뒤집기`}
      >
        {/* 앞면: 액자 + 포스터 */}
        <div
          className="absolute inset-0 rounded-md border-[6px] border-amber-900 bg-amber-950 p-1 shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {movie.poster && !imgFailed ? (
            <img
              src={movie.poster}
              alt={movie.title}
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center"
              style={{
                backgroundColor: movie.color ?? '#334155',
                backgroundImage:
                  'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55))',
              }}
            >
              <span className="text-3xl">{movie.emoji ?? '🎬'}</span>
              <span className="text-xs font-bold leading-tight text-white">
                {movie.title}
              </span>
              {movie.year && (
                <span className="text-[10px] text-white/70">{movie.year}</span>
              )}
            </div>
          )}
        </div>

        {/* 뒷면: 코멘트 */}
        <div
          className="absolute inset-0 flex flex-col rounded-md border-[6px] border-amber-900 bg-[#fdf6e3] p-2 text-left shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-[11px] font-bold text-amber-700">
            🎬 {movie.title}
          </p>
          {movie.director && (
            <p className="text-[10px] font-bold text-slate-500">
              감독 {movie.director}
            </p>
          )}
          {/* whitespace-pre-line: 감상평 속 \n 을 줄바꿈으로 보여줘요 */}
          <p className="mt-1 flex-1 overflow-y-auto whitespace-pre-line text-xs leading-relaxed text-slate-700">
            {movie.comment}
          </p>
          {movie.by && (
            <p className="mt-1 text-right text-[10px] font-bold text-amber-800">
              — {movie.by} 추천
            </p>
          )}
        </div>
      </motion.button>
    </div>
  );
}

// 포스터 앞에서 🔍(또는 E키)를 누르면 열리는 "올해의 영화" 창
//  - 위: 호스트의 추천 (data.js movies)
//  - 아래: 친구들의 추천 (Firebase "partyMovies") + [+ 나도 추천하기]
export default function MovieWall({ open, onClose }) {
  const movies = partyData?.movies ?? [];
  const { items, error } = useFriendPicks('partyMovies', open);
  const [formOpen, setFormOpen] = useState(false);

  // 창이 닫히면 등록 폼도 닫기
  useEffect(() => {
    if (!open) setFormOpen(false);
  }, [open]);

  //  (친구 추천은 이모지 없이 제목만 크게)
  const friendMovies = items.map((m) => ({
    id: m.id,
    title: m.title,
    director: m.creator,
    comment: m.comment,
    color: m.color,
    by: m.nickname,
  }));

  return (
    <PixelModal
      open={open}
      onClose={onClose}
      label="🎞️ 올해의 영화"
      title="포스터를 누르면 감상평이 나와요"
      width={600}
    >
      {/* 호스트의 추천 */}
      <p className="mb-2 text-sm font-bold text-amber-200">⭐ 주인장의 추천</p>
      <div className="mx-auto grid max-w-[440px] grid-cols-3 gap-3">
        {movies.map((movie, i) => (
          <MovieCard key={movie.id ?? i} movie={movie} />
        ))}
      </div>

      {/* 친구들의 추천 */}
      <FriendHeader
        count={items.length}
        formOpen={formOpen}
        onToggle={() => setFormOpen(true)}
      />
      {formOpen && (
        <RecommendForm
          path="partyMovies"
          kind="영화"
          onDone={() => setFormOpen(false)}
        />
      )}
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
      {!error && items.length === 0 && !formOpen && (
        <p className="py-4 text-center text-sm text-white/50">
          아직 친구들의 추천이 없어요. 첫 번째로 추천해 보세요!
        </p>
      )}
      {items.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {friendMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </PixelModal>
  );
}
