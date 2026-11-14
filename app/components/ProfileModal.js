"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { normalizeLook } from "../lib/pixelCharacter";
import PixelModal from "./PixelModal";
import PixelCharacter from "./PixelCharacter";

// 친구가 파티에서 남긴 것들을 Firebase에서 닉네임으로 찾아 모아요
//  (소원은 "이름 숨기기"로 쓴 건 보이지 않아요)
const SOURCES = [
  { path: "guestbook", key: "guestbook" },
  { path: "wishes", key: "wishes" },
  { path: "partyMovies", key: "movies" },
  { path: "partyBooks", key: "books" },
];

function useUserTraces(nickname, open) {
  const [data, setData] = useState({ guestbook: [], wishes: [], movies: [], books: [] });
  useEffect(() => {
    if (!open || !nickname || !db) return;
    const offs = SOURCES.map(({ path, key }) =>
      onValue(ref(db, path), (snap) => {
        const list = [];
        snap.forEach((child) => {
          const v = child.val();
          if (v?.nickname === nickname) list.push({ id: child.key, ...v });
        });
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)); // 최신순
        setData((d) => ({ ...d, [key]: list }));
      })
    );
    return () => offs.forEach((off) => off());
  }, [nickname, open]);
  return data;
}

function Section({ title, children }) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-bold text-amber-200">{title}</p>
      {children}
    </div>
  );
}

// 🔍 프로필 보기 미니 창
//  - user: { nickname, ...look } (다른 접속자 정보)
export default function ProfileModal({ user, open, onClose }) {
  const nickname = user?.nickname;
  const { guestbook, wishes, movies, books } = useUserTraces(nickname, open);
  const empty = !guestbook.length && !wishes.length && !movies.length && !books.length;

  return (
    <PixelModal open={open} onClose={onClose} label="🔍 프로필" title={nickname ? `${nickname}님` : ""} width={420}>
      {user && (
        <div className="flex gap-4">
          {/* 캐릭터 */}
          <div className="flex h-36 w-24 shrink-0 items-end justify-center border-4 border-[#1a110e] bg-[#2b1d1a]">
            <PixelCharacter look={normalizeLook(user)} dir="down" scale={4} />
          </div>

          <div className="min-w-0 flex-1 text-sm">
            {empty && <p className="mt-2 text-white/60">아직 파티에 남긴 흔적이 없어요. 먼저 인사해 볼까요? 👋</p>}

            {guestbook[0] && (
              <Section title="✍️ 방명록">
                <p className="whitespace-pre-wrap break-words border-2 border-[#1a110e] bg-[#fdf6e3] px-2 py-1.5 text-[#2b1d1a]">
                  {guestbook[0].text}
                </p>
              </Section>
            )}
            {wishes[0] && (
              <Section title="🎄 새해 소원">
                <p className="whitespace-pre-wrap break-words border-2 border-[#1a110e] bg-[#fde68a] px-2 py-1.5 text-[#2b1d1a]">
                  {wishes[0].text}
                </p>
              </Section>
            )}
            {(movies.length > 0 || books.length > 0) && (
              <Section title="⭐ 추천한 영화·책">
                <div className="flex flex-wrap gap-1.5">
                  {movies.map((m) => (
                    <span key={m.id} className="border-2 border-[#1a110e] px-1.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: m.color }}>
                      🎬 {m.title}
                    </span>
                  ))}
                  {books.map((b) => (
                    <span key={b.id} className="border-2 border-[#1a110e] px-1.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: b.color }}>
                      📚 {b.title}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      )}
    </PixelModal>
  );
}
