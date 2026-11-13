// ===== 장작불 ASMR (타닥타닥) =====
// mp3 파일 없이 브라우저가 실시간으로 소리를 만들어요 (Web Audio API) → 업로드 용량 0
//  - 낮게 웅웅거리는 불길 소리 + 랜덤하게 튀는 "타닥" 소리

let ctx = null;
let master = null; // 전체 볼륨
let roarSource = null;
let crackleTimer = null;
let volume = 0.6; // 0 ~ 1

function ensureContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return false;
  if (!ctx) {
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return true;
}

// 웅웅거리는 불길 소리 (브라운 노이즈를 6초 만들어 반복)
function startRoar() {
  const seconds = 6;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.2;
  }
  roarSource = ctx.createBufferSource();
  roarSource.buffer = buffer;
  roarSource.loop = true;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 700;
  const gain = ctx.createGain();
  gain.gain.value = 0.55;
  roarSource.connect(lowpass).connect(gain).connect(master);
  roarSource.start();
}

// "타닥" 한 번
function crackle() {
  if (!roarSource) return; // 이미 꺼졌으면 무시
  const big = Math.random() < 0.15;
  const length = Math.floor(
    ctx.sampleRate * (big ? 0.03 : 0.008 + Math.random() * 0.01)
  );
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++)
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length / 5));
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 1500 + Math.random() * 2500;
  const gain = ctx.createGain();
  gain.gain.value = (big ? 0.9 : 0.35) * (0.5 + Math.random() * 0.5);
  src.connect(highpass).connect(gain).connect(master);
  src.start();
}

// 다음 "타닥"을 랜덤한 시간 뒤에 예약 (가끔은 타다닥 연달아)
function scheduleCrackles() {
  const wait = 40 + Math.random() * 220;
  crackleTimer = setTimeout(() => {
    crackle();
    if (Math.random() < 0.25) setTimeout(crackle, 30 + Math.random() * 60);
    scheduleCrackles();
  }, wait);
}

export function startFire() {
  if (typeof window === 'undefined' || !ensureContext()) return false;
  if (roarSource) return true; // 이미 재생 중
  startRoar();
  scheduleCrackles();
  return true;
}

export function stopFire() {
  clearTimeout(crackleTimer);
  crackleTimer = null;
  try {
    roarSource?.stop();
  } catch {}
  roarSource = null;
}

// v: 0 ~ 100
export function setFireVolume(v) {
  volume = Math.max(0, Math.min(1, v / 100));
  if (master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
}
