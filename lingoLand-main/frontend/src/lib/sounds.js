let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration = 0.15, vol = 0.25) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function playSuccess() { playTone(880, 0.12); setTimeout(() => playTone(1100, 0.15), 100); }
export function playError() { playTone(220, 0.3, 0.2); }
export function playScore() { playTone(660, 0.08); setTimeout(() => playTone(880, 0.08), 80); setTimeout(() => playTone(1100, 0.12), 160); }
export function playClick() { playTone(440, 0.05, 0.15); }
export function playLevelUp() { [0,100,200,300].forEach((d,i) => setTimeout(() => playTone(440 + i*220, 0.15), d)); }

export function speak(text, rate = 0.75) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}
