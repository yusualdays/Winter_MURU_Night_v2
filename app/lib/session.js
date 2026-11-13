// 이 탭(접속)만의 고유 ID — 같은 컴퓨터에서 탭 2개를 열면 2명으로 인식
export function getMyId() {
  try {
    let id = sessionStorage.getItem('partyUserId');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('partyUserId', id);
    }
    return id;
  } catch {
    return 'guest-' + Math.random().toString(36).slice(2, 10);
  }
}

// 입장할 때 저장한 내 닉네임
export function getNickname() {
  try {
    return localStorage.getItem('partyNickname') || '';
  } catch {
    return '';
  }
}

// Firebase 경로에는 . # $ [ ] / 를 쓸 수 없어서 안전한 글자로 바꾸기
export function toKey(name = '') {
  return name.replace(
    /[.#$\[\]\/%]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

// 입장할 때 꾸민 캐릭터 { hair, hairColor, skin, outfit }
export function getLook() {
  try {
    return JSON.parse(localStorage.getItem('partyLook') || 'null');
  } catch {
    return null;
  }
}

export function saveLook(look) {
  try {
    localStorage.setItem('partyLook', JSON.stringify(look));
  } catch {}
}
