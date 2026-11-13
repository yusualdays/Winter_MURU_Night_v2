'use client';

import { useEffect, useState } from 'react';
import { partyData } from '../data';
import PixelModal from './PixelModal';
import { useFriendPicks, RecommendForm, FriendHeader } from './FriendPicks';

// 책마다 높이·두께를 조금씩 다르게
const spineHeight = (i) => 78 + ((i * 7) % 4) * 6; // 78~96%
const spineWidth = (i) => 40 + ((i * 5) % 3) * 8; // 40~56px

// 책꽂이 한 개: 책등만 한 줄로 나열 (창이 좁아서 다 안 들어가면 자동으로 다음 칸으로 넘어가요)
//  - 칸마다 아래에 나무 선반이 그려져요 (배경 줄무늬가 칸 높이와 딱 맞게 반복)
const ROW_H = 128; // 한 칸 높이 (책이 서 있는 공간)
const BOARD_H = 8; // 선반 두께

function Shelf({ books, onSelect }) {
  return (
    <div className="rounded-lg border-[8px] border-amber-950 bg-amber-950/90">
      <div
        className="flex flex-wrap items-end px-2"
        style={{
          columnGap: 4,
          rowGap: BOARD_H,
          paddingBottom: BOARD_H,
          // 칸(어두운 공간 ROW_H) + 선반(BOARD_H)이 위에서부터 계속 반복
          backgroundImage: `repeating-linear-gradient(to bottom, rgba(0,0,0,0.35) 0, rgba(0,0,0,0.15) ${ROW_H}px, #92400e ${ROW_H}px, #92400e ${
            ROW_H + BOARD_H
          }px)`,
        }}
      >
        {books.map((book, index) => (
          // 책 한 권이 차지하는 칸 (높이 = 한 칸 높이, 책은 바닥에 붙여서)
          <div
            key={book.id ?? index}
            className="flex items-end"
            style={{ height: ROW_H }}
          >
            <button
              type="button"
              onClick={() => onSelect(book)}
              title={book.title}
              className="flex items-center justify-center rounded-t-sm border-x border-black/20 shadow-md transition-transform duration-200 hover:-translate-y-3"
              style={{
                height: `${spineHeight(index)}%`,
                width: spineWidth(index),
                backgroundColor: book.color ?? '#64748b',
              }}
            >
              <span
                className="max-h-full overflow-hidden text-sm font-bold text-white/90"
                style={{ writingMode: 'vertical-rl' }}
              >
                {book.title}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
// 책꽂이 앞에서 🔍(또는 E키)를 누르면 열리는 "올해의 책" 창
//  - 위: 호스트의 책꽂이 (data.js books)
//  - 아래: 친구들의 책꽂이 (Firebase "partyBooks") + [+ 나도 추천하기]
export default function Bookshelf({ open, onClose }) {
  const books = partyData?.books ?? [];
  const { items, error } = useFriendPicks('partyBooks', open);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  // 창이 닫히면 처음(책꽂이) 화면으로 되돌리기
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setFormOpen(false);
    }
  }, [open]);

  // 친구 추천을 책 모양으로 바꾸기
  const friendBooks = items.map((b) => ({
    id: b.id,
    title: b.title,
    comment: b.comment,
    color: b.color,
    author: b.creator
      ? `${b.creator} · ${b.nickname} 님의 추천`
      : `${b.nickname} 님의 추천`,
    by: b.nickname,
  }));

  return (
    <PixelModal
      open={open}
      onClose={onClose}
      label="📚 올해의 책"
      title={selected ? selected.title : '올해의 책을 추천해주세요'}
      width={600}
    >
      {!selected ? (
        <>
          {/* 호스트의 책꽂이 */}
          <p className="mb-2 text-sm font-bold text-amber-200">
            ⭐ 주인장의 추천
          </p>
          <Shelf books={books} onSelect={setSelected} />

          {/* 친구들의 책꽂이 */}
          <FriendHeader
            count={items.length}
            formOpen={formOpen}
            onToggle={() => setFormOpen(true)}
          />
          {formOpen && (
            <RecommendForm
              path="partyBooks"
              kind="책"
              onDone={() => setFormOpen(false)}
            />
          )}
          {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
          {!error && items.length === 0 && !formOpen && (
            <p className="py-4 text-center text-sm text-white/50">
              아직 친구들의 추천이 없어요. 첫 번째로 꽂아 보세요!
            </p>
          )}
          {friendBooks.length > 0 && (
            <div className="mt-3">
              <Shelf books={friendBooks} onSelect={setSelected} />
            </div>
          )}
        </>
      ) : (
        /* 책 상세: 표지 색 + 코멘트 */
        <div className="flex gap-5">
          <div
            className="flex h-44 w-32 shrink-0 flex-col justify-between rounded-r-lg rounded-l-sm p-3 shadow-xl"
            style={{
              backgroundColor: selected.color ?? '#64748b',
              backgroundImage:
                'linear-gradient(90deg, rgba(0,0,0,0.25) 0 8px, transparent 8px)',
            }}
          >
            <p className="pl-2 text-sm font-bold leading-snug">
              {selected.title}
            </p>
            <p className="pl-2 text-xs text-white/80">
              {selected.by ? `${selected.by} 추천` : selected.author}
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-sm text-slate-400">{selected.author}</p>
            <p className="mt-2 flex-1 whitespace-pre-line break-words leading-relaxed text-slate-200">
              “{selected.comment}”
            </p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-4 self-start rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
            >
              ← 책꽂이로
            </button>
          </div>
        </div>
      )}
    </PixelModal>
  );
}
