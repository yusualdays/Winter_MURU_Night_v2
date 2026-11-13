// ================== 픽셀아트 캐릭터 만들기 ==================
// 이미지 파일 없이 코드로 도트 캐릭터를 그려요 (16x24 도트 + 테두리).
// 머리 / 머리색 / 피부색 / 옷 을 조합해서, 앞·뒤·옆 걷기 3프레임과 건배 포즈를 만들어요.

export const GRID_W = 18;
export const GRID_H = 25;

// ---------- 고를 수 있는 것들 ----------
export const HAIR_STYLES = [
  { id: 'short', name: '짧은 머리' },
  { id: 'bob', name: '단발' },
  { id: 'ponytail', name: '포니테일' },
  { id: 'wavy', name: '웨이브' },
  { id: 'braids', name: '땋은 머리' },
  { id: 'bun', name: '똥머리' },
  { id: 'spiky', name: '삐죽 머리' },
  { id: 'afro', name: '곱슬 머리' },
  { id: 'beanie', name: '비니' },
  { id: 'santa', name: '산타 모자' },
  { id: 'antlers', name: '루돌프 뿔' },
  { id: 'earmuffs', name: '귀도리' },
];

export const HAIR_COLORS = [
  {
    id: 'brown',
    name: '갈색',
    base: '#6b3f22',
    shade: '#4b2a15',
    light: '#8f5a33',
  },
  {
    id: 'black',
    name: '검정',
    base: '#2e2a33',
    shade: '#1c1a20',
    light: '#4a4552',
  },
  {
    id: 'blonde',
    name: '금발',
    base: '#e3b84f',
    shade: '#b98a2c',
    light: '#f6d77e',
  },
  {
    id: 'ginger',
    name: '주황',
    base: '#d4652a',
    shade: '#a8481a',
    light: '#ee8b4a',
  },
  {
    id: 'silver',
    name: '은발',
    base: '#a9b6c6',
    shade: '#7c889a',
    light: '#d2dbe6',
  },
  {
    id: 'auburn',
    name: '적갈색',
    base: '#8e3a22',
    shade: '#672614',
    light: '#b45535',
  },
];

export const SKIN_TONES = [
  { id: 'light', name: '밝은', base: '#f7d6b8', shade: '#e2b28c' },
  { id: 'warm', name: '웜톤', base: '#e7b086', shade: '#c98d61' },
  { id: 'tan', name: '구릿빛', base: '#b97a4f', shade: '#9a5f39' },
  { id: 'deep', name: '짙은', base: '#7a4a2d', shade: '#5e3720' },
];

export const OUTFITS = [
  {
    id: 'nordic-red',
    name: '노르딕 니트',
    kind: 'knit',
    base: '#c8323a',
    shade: '#94212a',
    accent: '#f5efe6',
  },
  {
    id: 'nordic-green',
    name: '초록 니트',
    kind: 'knit',
    base: '#2f7a4a',
    shade: '#205536',
    accent: '#f5efe6',
  },
  {
    id: 'duffle-navy',
    name: '더플코트',
    kind: 'duffle',
    base: '#25365e',
    shade: '#18233f',
    accent: '#e8cf9a',
    scarf: ['#c8323a', '#f5efe6'],
  },
  {
    id: 'duffle-camel',
    name: '카멜 더플',
    kind: 'duffle',
    base: '#b7834a',
    shade: '#8d6233',
    accent: '#f2e2c0',
    scarf: ['#2f7a4a', '#1f5a35'],
  },
  {
    id: 'padding-yellow',
    name: '노랑 패딩',
    kind: 'padding',
    base: '#e8b730',
    shade: '#b98a1c',
    accent: '#f6d76a',
  },
  {
    id: 'padding-navy',
    name: '네이비 패딩',
    kind: 'padding',
    base: '#2a3d6b',
    shade: '#1b2849',
    accent: '#3f5690',
  },
  {
    id: 'overalls',
    name: '멜빵바지',
    kind: 'overalls',
    base: '#c8323a',
    shade: '#94212a',
    accent: '#3e64a3',
  },
  {
    id: 'hoodie-brown',
    name: '갈색 후드티',
    kind: 'hoodie',
    base: '#6e4630',
    shade: '#4f3020',
    accent: '#efe6dc',
  },
  {
    id: 'hoodie-green',
    name: '초록 후드티',
    kind: 'hoodie',
    base: '#2f8a5a',
    shade: '#1f6340',
    accent: '#efe6dc',
  },
  {
    id: 'fur-coat',
    name: '털 코트',
    kind: 'furcoat',
    base: '#b8262f',
    shade: '#871a22',
    accent: '#fbf7f2',
  },
];

export const DEFAULT_LOOK = {
  hair: 'short',
  hairColor: 'brown',
  skin: 'light',
  outfit: 'nordic-red',
};

const OUTLINE = '#2b1d1a';
const EYE = '#2b1d1a';
const BLUSH = '#f28b8b';
const MOUTH = '#a8433a';
const DENIM = { base: '#3b5a8c', shade: '#2b446d' };
const SHOE = '#4a2e1e';
const WHITE = '#fbf7f2';

const find = (list, id) => list.find((o) => o.id === id) ?? list[0];

// ---------- 도화지 ----------
function makeGrid() {
  return Array.from({ length: GRID_H }, () => Array(GRID_W).fill(null));
}
// 디자인 좌표 (0~15, 0~23) → 테두리 여백 1칸 포함 좌표
function painter(g) {
  const put = (x, y, c) => {
    const X = x + 1,
      Y = y + 1;
    if (X >= 0 && X < GRID_W && Y >= 0 && Y < GRID_H && c) g[Y][X] = c;
  };
  const rect = (x1, y1, x2, y2, c) => {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, c);
  };
  const get = (x, y) => g[y + 1]?.[x + 1] ?? null;
  return { put, rect, get };
}

// ---------- 몸 (방향 / 프레임) ----------
// view: "front" | "back" | "side"(오른쪽 보기), frame: 0,1,2 (1 = 제자리), pose: "walk" | "cheer"
function drawBody(p, view, frame, pose, skin, outfit) {
  const { put, rect } = p;
  const top = outfit.base,
    topShade = outfit.shade;
  const pants =
    outfit.kind === 'overalls'
      ? { base: outfit.accent, shade: DENIM.shade }
      : DENIM;

  // 머리(얼굴)
  rect(5, 3, 10, 3, skin.base);
  rect(4, 4, 11, 9, skin.base);
  rect(5, 10, 10, 10, skin.base);
  rect(7, 11, 8, 11, skin.shade); // 목

  if (view === 'front') {
    if (pose === 'cheer') {
      // 웃는 눈(^ ^) + 크게 벌린 입
      put(5, 7, EYE);
      put(6, 6, EYE);
      put(7, 7, EYE);
      put(8, 7, EYE);
      put(9, 6, EYE);
      put(10, 7, EYE);
      rect(7, 8, 8, 9, MOUTH);
      put(5, 8, BLUSH);
      put(10, 8, BLUSH);
    } else {
      rect(6, 6, 6, 7, EYE);
      rect(9, 6, 9, 7, EYE);
      put(5, 8, BLUSH);
      put(10, 8, BLUSH);
      rect(7, 9, 8, 9, skin.shade);
    }
  } else if (view === 'side') {
    rect(9, 6, 9, 7, EYE);
    put(10, 8, BLUSH);
    put(11, 7, skin.shade); // 코
    put(10, 9, skin.shade); // 입
    put(7, 7, skin.shade); // 귀
  }

  // 몸통
  if (view === 'side') {
    rect(5, 11, 10, 17, top);
    rect(5, 17, 10, 17, topShade);
  } else {
    rect(5, 11, 10, 11, top);
    rect(4, 12, 11, 17, top);
    rect(4, 17, 11, 17, topShade);
  }

  // 팔
  if (pose === 'cheer') {
    // 양팔 번쩍! (frame 1이면 1칸 더 위로)
    const up = frame === 1 ? 1 : 0;
    rect(3, 9 - up, 3, 12, top);
    put(4, 12, top);
    put(3, 8 - up, skin.base);
    put(2, 8 - up, skin.base);
    rect(12, 9 - up, 12, 12, top);
    put(11, 12, top);
    put(12, 8 - up, skin.base);
    put(13, 8 - up, skin.base);
    // 오른손: 맥주잔 🍺
    rect(12, 4 - up, 14, 4 - up, WHITE);
    rect(12, 5 - up, 14, 7 - up, '#f2a83a');
    rect(12, 5 - up, 12, 7 - up, '#d98a1f');
    put(15, 5 - up, '#f6d27e');
    put(15, 6 - up, '#f6d27e');
    // 왼손: 샴페인잔 🥂
    put(1, 4 - up, '#f6e7a8');
    put(2, 4 - up, '#f6e7a8');
    put(1, 5 - up, '#f6e7a8');
    put(2, 5 - up, '#f6e7a8');
    put(2, 6 - up, WHITE);
    put(2, 7 - up, WHITE);
  } else if (view === 'side') {
    if (frame === 0) {
      rect(8, 12, 9, 15, topShade);
      put(10, 16, skin.base);
    } else if (frame === 2) {
      rect(6, 12, 7, 15, topShade);
      put(5, 16, skin.base);
    } else {
      rect(7, 12, 8, 16, topShade);
      rect(7, 17, 8, 17, skin.base);
    }
  } else {
    const swingL = frame === 0 ? -1 : frame === 2 ? 1 : 0;
    const swingR = -swingL;
    rect(3, 12 + swingL, 3, 16 + swingL, topShade);
    put(3, 17 + swingL, skin.base);
    rect(12, 12 + swingR, 12, 16 + swingR, topShade);
    put(12, 17 + swingR, skin.base);
  }

  // 다리 + 신발 (건배 포즈일 때는 두 발 모두 땅에)
  if (pose === 'cheer') frame = 1;
  if (view === 'side') {
    if (frame === 1) {
      rect(6, 18, 9, 21, pants.base);
      rect(6, 18, 6, 21, pants.shade);
      rect(6, 22, 10, 23, SHOE);
    } else {
      const backLeg = frame === 0 ? pants.shade : pants.base;
      const frontLeg = frame === 0 ? pants.base : pants.shade;
      rect(6, 18, 7, 19, backLeg);
      rect(5, 20, 6, 21, backLeg);
      rect(4, 22, 6, 23, SHOE);
      rect(8, 18, 9, 19, frontLeg);
      rect(9, 20, 10, 21, frontLeg);
      rect(9, 22, 11, 23, SHOE);
    }
  } else {
    const liftL = frame === 2 ? 1 : 0; // 걷는 동안 한쪽 발을 살짝 들기
    const liftR = frame === 0 ? 1 : 0;
    rect(5, 18, 7, 21 - liftL, pants.base);
    rect(5, 18, 5, 21 - liftL, pants.shade);
    rect(5, 22 - liftL, 7, 23 - liftL, SHOE);
    rect(8, 18, 10, 21 - liftR, pants.base);
    rect(10, 18, 10, 21 - liftR, pants.shade);
    rect(8, 22 - liftR, 10, 23 - liftR, SHOE);
  }
}

// ---------- 옷 무늬 ----------
function drawOutfitDetails(p, view, pose, outfit) {
  const { put, rect, get } = p;
  const isTorso = (x, y) => get(x, y) === outfit.base;
  const L = view === 'side' ? 5 : 4;
  const R = view === 'side' ? 10 : 11;
  const paint = (x, y, c) => {
    if (isTorso(x, y)) put(x, y, c);
  };

  switch (outfit.kind) {
    case 'knit': // 노르딕 무늬 두 줄
      for (let x = L; x <= R; x++) {
        if ((x + 1) % 2) paint(x, 13, outfit.accent);
        if (x % 3 === 1) paint(x, 15, outfit.accent);
      }
      for (let x = L; x <= R; x++) paint(x, 11, outfit.shade); // 목 부분
      break;
    case 'padding': // 가로 퀼팅 줄
      for (let x = L; x <= R; x++) {
        paint(x, 13, outfit.shade);
        paint(x, 15, outfit.shade);
        paint(x, 11, outfit.accent);
      }
      if (view === 'front')
        for (let y = 12; y <= 16; y++) paint(7, y, outfit.shade);
      break;
    case 'duffle': // 토글 단추 + 목도리
      if (view === 'front') {
        put(7, 13, outfit.accent);
        put(8, 13, outfit.accent);
        put(7, 15, outfit.accent);
        put(8, 15, outfit.accent);
      }
      if (view === 'side') {
        put(9, 13, outfit.accent);
        put(9, 15, outfit.accent);
      }
      if (view === 'back')
        for (let x = 5; x <= 10; x++) paint(x, 12, outfit.shade); // 후드
      for (let x = L + 1; x <= R - 1; x++)
        put(x, 11, x % 2 ? outfit.scarf[0] : outfit.scarf[1]);
      if (view === 'front') {
        put(9, 12, outfit.scarf[0]);
        put(9, 13, outfit.scarf[1]);
        put(9, 14, outfit.scarf[0]);
      }
      break;
    case 'overalls': // 셔츠 위에 멜빵
      for (let y = 14; y <= 17; y++)
        for (let x = L; x <= R; x++) paint(x, y, outfit.accent);
      if (view !== 'side') {
        for (let y = 11; y <= 13; y++) {
          paint(5, y, outfit.accent);
          paint(10, y, outfit.accent);
        }
      } else {
        for (let y = 11; y <= 13; y++) paint(8, y, outfit.accent);
      }
      if (view === 'front') {
        put(5, 14, '#f6d27e');
        put(10, 14, '#f6d27e');
        rect(6, 15, 9, 15, DENIM.shade);
      }
      break;
    case 'hoodie': // 후드 끈 + 주머니
      if (view === 'front') {
        put(6, 12, outfit.accent);
        put(6, 13, outfit.accent);
        put(9, 12, outfit.accent);
        put(9, 13, outfit.accent);
        rect(6, 15, 9, 16, outfit.shade);
      }
      if (view === 'back') {
        rect(5, 11, 10, 13, outfit.shade);
        rect(6, 12, 9, 12, outfit.base);
      }
      if (view === 'side') {
        rect(5, 11, 6, 13, outfit.shade);
      }
      break;
    case 'furcoat': // 하얀 털 장식
      for (let x = L; x <= R; x++) {
        paint(x, 11, outfit.accent);
        paint(x, 17, outfit.accent);
      }
      if (view === 'front')
        for (let y = 12; y <= 16; y++) {
          paint(7, y, outfit.accent);
          paint(8, y, outfit.shade);
        }
      if (pose !== 'cheer' && view !== 'side') {
        put(3, 16, outfit.accent);
        put(12, 16, outfit.accent);
      }
      break;
  }
}

// ---------- 머리카락 / 모자 ----------
function drawHair(p, view, style, hc) {
  const { put, rect } = p;
  const H = hc.base,
    S = hc.shade,
    Lt = hc.light;

  const shortBase = () => {
    if (view === 'front') {
      rect(4, 2, 11, 4, H);
      rect(5, 1, 10, 1, H);
      [4, 5, 7, 8, 10, 11].forEach((x) => put(x, 5, H));
      put(4, 6, H);
      put(11, 6, H);
      rect(6, 1, 8, 1, Lt);
    } else if (view === 'back') {
      rect(5, 1, 10, 1, H);
      rect(4, 2, 11, 9, H);
      rect(5, 10, 10, 10, S);
      rect(4, 8, 11, 9, S);
      rect(6, 1, 8, 1, Lt);
    } else {
      rect(5, 1, 10, 1, H);
      rect(4, 2, 11, 4, H);
      rect(4, 5, 7, 9, H);
      put(8, 5, H);
      put(10, 5, H);
      rect(5, 10, 6, 10, S);
      rect(4, 8, 6, 9, S);
      rect(6, 1, 8, 1, Lt);
    }
  };

  switch (style) {
    case 'short':
      shortBase();
      break;
    case 'bob':
      shortBase();
      if (view === 'front') {
        rect(3, 4, 4, 10, H);
        rect(11, 4, 12, 10, H);
        rect(3, 9, 4, 10, S);
        rect(11, 9, 12, 10, S);
      } else if (view === 'back') {
        rect(3, 3, 12, 10, H);
        rect(3, 9, 12, 10, S);
      } else {
        rect(3, 4, 7, 10, H);
        rect(3, 9, 7, 10, S);
      }
      break;
    case 'ponytail':
      shortBase();
      if (view === 'front') {
        rect(12, 4, 13, 9, S);
        put(12, 3, '#c8323a');
      } else if (view === 'back') {
        put(7, 9, '#c8323a');
        put(8, 9, '#c8323a');
        rect(7, 10, 8, 14, H);
        rect(8, 12, 8, 14, S);
      } else {
        put(3, 4, '#c8323a');
        rect(1, 4, 3, 6, H);
        rect(1, 7, 2, 11, H);
        rect(1, 10, 2, 11, S);
      }
      break;
    case 'wavy':
      shortBase();
      if (view === 'front') {
        for (let y = 4; y <= 14; y++) {
          const w = y % 4 < 2;
          put(w ? 2 : 3, y, H);
          put(3, y, H);
          put(4, y, H);
          put(w ? 13 : 12, y, H);
          put(12, y, H);
          put(11, y, H);
        }
        rect(4, 7, 4, 14, S);
        rect(11, 7, 11, 14, S);
      } else if (view === 'back') {
        rect(3, 2, 12, 14, H);
        for (let y = 4; y <= 14; y++) {
          if (y % 4 < 2) {
            put(2, y, H);
            put(13, y, H);
          }
        }
        for (let x = 4; x <= 11; x += 2) rect(x, 8, x, 14, S);
      } else {
        rect(2, 4, 7, 14, H);
        for (let y = 5; y <= 14; y++) if (y % 4 < 2) put(1, y, H);
        rect(3, 8, 3, 14, S);
        rect(5, 8, 5, 14, S);
      }
      break;
    case 'braids': {
      shortBase();
      const braid = (x, y1, y2) => {
        for (let y = y1; y <= y2; y++) put(x, y, y % 2 ? H : S);
        put(x, y2 + 1, '#c8323a');
        put(x, y2 + 2, H);
      };
      if (view === 'front') {
        put(3, 6, H);
        put(12, 6, H);
        braid(3, 7, 14);
        braid(12, 7, 14);
      } else if (view === 'back') {
        braid(5, 10, 15);
        braid(10, 10, 15);
      } else {
        braid(3, 7, 14);
      }
      break;
    }
    case 'bun':
      shortBase();
      if (view === 'side') {
        rect(3, 0, 5, 2, H);
        put(4, 0, Lt);
        put(5, 3, '#c8323a');
      } else {
        rect(6, -1, 9, 0, H);
        rect(5, 0, 10, 0, H);
        put(7, -1, Lt);
        rect(6, 1, 9, 1, '#c8323a');
      }
      break;
    case 'spiky':
      shortBase();
      if (view === 'side') {
        put(4, 0, H);
        put(6, 0, H);
        put(8, 0, H);
        put(3, 1, H);
        put(3, 3, H);
        put(2, 2, H);
        put(5, -1, H);
      } else {
        [4, 6, 8, 10].forEach((x) => put(x, 0, H));
        [5, 9].forEach((x) => put(x, -1, H));
        put(3, 2, H);
        put(12, 2, H);
        put(7, -1, Lt);
      }
      if (view === 'front') {
        put(6, 5, H);
        put(9, 5, H);
      }
      break;
    case 'afro': {
      if (view === 'front') {
        rect(3, 0, 12, 4, H);
        rect(2, 1, 13, 4, H);
        rect(2, 5, 4, 9, H);
        rect(11, 5, 13, 9, H);
        [5, 7, 8, 10].forEach((x) => put(x, 5, H));
      } else if (view === 'back') {
        rect(3, 0, 12, 10, H);
        rect(2, 1, 13, 9, H);
      } else {
        rect(3, 0, 11, 4, H);
        rect(2, 1, 12, 4, H);
        rect(2, 5, 7, 10, H);
        put(8, 5, H);
      }
      // 곱슬 질감
      for (let y = 0; y <= 10; y++)
        for (let x = 2; x <= 13; x++)
          if ((x * 3 + y * 5) % 7 === 0 && p.get(x, y) === H) put(x, y, S);
      for (let x = 4; x <= 9; x += 2) if (p.get(x, 0) === H) put(x, 0, Lt);
      break;
    }
    case 'beanie': {
      const hat = '#2f7a4a',
        hatShade = '#205536';
      if (view === 'front') {
        put(4, 6, H);
        put(11, 6, H);
        put(4, 7, H);
        put(11, 7, H);
      } else if (view === 'back') {
        rect(4, 6, 11, 9, H);
        rect(5, 10, 10, 10, S);
      } else {
        rect(4, 6, 7, 9, H);
      }
      rect(4, 1, 11, 4, hat);
      rect(5, 0, 10, 0, hat);
      rect(3, 4, 12, 5, hatShade);
      for (let x = 5; x <= 10; x += 2) rect(x, 1, x, 3, hatShade);
      rect(7, -2, 8, -1, WHITE);
      break;
    }
    case 'santa': {
      const red = '#d42f2f',
        redShade = '#a31f1f';
      if (view === 'front') {
        put(4, 6, H);
        put(11, 6, H);
      } else if (view === 'back') {
        rect(4, 6, 11, 9, H);
        rect(5, 10, 10, 10, S);
      } else {
        rect(4, 6, 7, 9, H);
      }
      rect(5, 1, 10, 3, red);
      rect(6, 0, 9, 0, red);
      rect(9, 1, 10, 3, redShade);
      if (view === 'side') {
        rect(2, 0, 5, 1, red);
        put(1, 1, red);
        rect(0, 2, 1, 3, WHITE);
      } else {
        rect(10, -1, 12, 0, red);
        put(13, 0, red);
        rect(13, 1, 14, 2, WHITE);
      }
      rect(3, 4, 12, 5, WHITE);
      break;
    }
    case 'antlers': {
      shortBase();
      const band = '#b8262f',
        antler = '#8a5a32';
      if (view !== 'side') rect(4, 2, 11, 2, band);
      else rect(4, 2, 10, 2, band);
      const left = view === 'side' ? 5 : 4;
      const right = view === 'side' ? 9 : 11;
      // 왼쪽 뿔
      rect(left, -1, left, 1, antler);
      put(left - 1, -1, antler);
      put(left - 2, -2, antler);
      put(left + 1, -2, antler);
      // 오른쪽 뿔
      rect(right, -1, right, 1, antler);
      put(right + 1, -1, antler);
      put(right + 2, -2, antler);
      put(right - 1, -2, antler);
      break;
    }
    case 'earmuffs': {
      shortBase();
      const muff = '#f3f0ee',
        muffShade = '#d7a6b8',
        band = '#8a8f9c';
      rect(4, 0, 11, 0, band);
      put(3, 1, band);
      put(12, 1, band);
      if (view === 'side') {
        rect(6, 5, 8, 8, muff);
        rect(6, 8, 8, 8, muffShade);
      } else {
        rect(2, 5, 4, 8, muff);
        rect(11, 5, 13, 8, muff);
        rect(2, 8, 4, 8, muffShade);
        rect(11, 8, 13, 8, muffShade);
        rect(2, 2, 2, 4, band);
        rect(13, 2, 13, 4, band);
      }
      break;
    }
    default:
      shortBase();
  }
}

// ---------- 테두리 ----------
function outline(g) {
  const out = g.map((row) => row.slice());
  for (let y = 0; y < GRID_H; y++)
    for (let x = 0; x < GRID_W; x++) {
      if (g[y][x]) continue;
      const near = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => g[y + dy]?.[x + dx]);
      if (near) out[y][x] = OUTLINE;
    }
  return out;
}

// ---------- 완성: 한 장면(프레임) ----------
export function buildSprite(
  look = DEFAULT_LOOK,
  view = 'front',
  frame = 1,
  pose = 'walk'
) {
  const skin = find(SKIN_TONES, look.skin);
  const hc = find(HAIR_COLORS, look.hairColor);
  const outfit = find(OUTFITS, look.outfit);
  const style = (HAIR_STYLES.find((h) => h.id === look.hair) ?? HAIR_STYLES[0])
    .id;

  const g = makeGrid();
  const p = painter(g);
  const v = pose === 'cheer' ? 'front' : view;
  drawBody(p, v, frame, pose, skin, outfit);
  drawOutfitDetails(p, v, pose, outfit);
  drawHair(p, v, style, hc);
  return outline(g);
}

// SVG 그림(데이터 주소)으로 바꾸기 — 같은 조합은 한 번만 만들고 재사용
const cache = new Map();
export function spriteUrl(look, view, frame, pose = 'walk') {
  const key = `${look?.hair}|${look?.hairColor}|${look?.skin}|${look?.outfit}|${view}|${frame}|${pose}`;
  if (cache.has(key)) return cache.get(key);
  const g = buildSprite(look, view, frame, pose);
  let rects = '';
  for (let y = 0; y < GRID_H; y++) {
    let x = 0;
    while (x < GRID_W) {
      const c = g[y][x];
      if (!c) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < GRID_W && g[y][x + run] === c) run++;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${c}"/>`;
      x += run;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_W} ${GRID_H}" width="${GRID_W}" height="${GRID_H}" shape-rendering="crispEdges">${rects}</svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(key, url);
  return url;
}

// 저장된 값이 이상해도 안전하게 기본값으로
export function normalizeLook(look) {
  return {
    hair: HAIR_STYLES.some((h) => h.id === look?.hair)
      ? look.hair
      : DEFAULT_LOOK.hair,
    hairColor: HAIR_COLORS.some((h) => h.id === look?.hairColor)
      ? look.hairColor
      : DEFAULT_LOOK.hairColor,
    skin: SKIN_TONES.some((s) => s.id === look?.skin)
      ? look.skin
      : DEFAULT_LOOK.skin,
    outfit: OUTFITS.some((o) => o.id === look?.outfit)
      ? look.outfit
      : DEFAULT_LOOK.outfit,
  };
}
