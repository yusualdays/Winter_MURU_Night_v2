// ===== '쨍그랑' 건배 소리 =====
// mp3 파일 없이 브라우저가 직접 소리를 만들어요 (Web Audio API) → 업로드 용량 0
// 직접 녹음한 mp3를 쓰고 싶으면 public 폴더에 넣고 아래에 경로를 적으세요. 예: "/clink.mp3"
const TOAST_SOUND_SRC = '';

let ctx = null;

// 브라우저는 사용자가 한 번이라도 클릭/키 입력을 해야 소리를 허락해요.
// 거실에서 처음 클릭하거나 방향키를 누를 때 소리 장치를 미리 깨워 둬요.
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

// 유리잔 한 번 "팅~"
function clink(at, pitch) {
  const master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);

  // 유리잔 특유의 맑은 배음들 (높은 음 여러 개를 겹치기)
  [1, 1.51, 2.02, 2.76].forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = pitch * ratio;
    const peak = 0.5 / (i + 1);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.004); // 아주 빠르게 "팅"
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.4 - i * 0.25); // 천천히 울림이 사라짐
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + 1.5);
  });

  // 잔끼리 부딪히는 순간의 "딱" 소리 (아주 짧은 잡음)
  const len = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++)
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len / 6));
  const noise = ctx.createBufferSource();
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3000;
  const ng = ctx.createGain();
  ng.gain.value = 0.25;
  noise.buffer = buffer;
  noise.connect(hp).connect(ng).connect(master);
  noise.start(at);
}

export function playToastSound() {
  if (TOAST_SOUND_SRC) {
    const audio = new Audio(TOAST_SOUND_SRC);
    audio.play().catch(() => {});
    return;
  }
  unlockAudio();
  if (!ctx || ctx.state !== 'running') return; // 아직 소리가 허락되지 않은 경우
  const now = ctx.currentTime + 0.02;
  clink(now, 1750); // 첫 번째 잔
  clink(now + 0.07, 2050); // 두 번째 잔 (살짝 늦게, 조금 다른 음)
}
