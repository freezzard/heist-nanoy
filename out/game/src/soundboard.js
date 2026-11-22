// soundboard.js — every sound is synthesized with WebAudio oscillators at play
// time: no audio files, no samples, nothing borrowed. Wren's night is quiet
// electronics through one master gain: soft chimes for loot, a rising tick
// while eyes are on her, a low sting when the night goes wrong.

let sharedCtx = null;
let masterGain = null;
let muted = false;

export function setMuted(nextMuted) {
  muted = nextMuted;
}

export function isMuted() {
  const state = muted;
  return state;
}

function audioCtx() {
  let ctx = sharedCtx;
  if (ctx === null) {
    try { sharedCtx = new window.AudioContext(); ctx = sharedCtx; } catch (audioErr) { ctx = null; }
    if (ctx !== null) {
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(ctx.destination);
    }
  }
  if (ctx !== null && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freqFrom, freqTo, seconds, type, gainPeak, delay) {
  if (muted) return;
  const ctx = audioCtx();
  if (ctx === null || masterGain === null) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

export function sndStart() {
  tone(440, 440, 0.09, 'triangle', 0.08, 0);
  tone(587, 587, 0.14, 'triangle', 0.08, 0.08);
}

export function sndPickup() {
  tone(880, 1320, 0.14, 'sine', 0.12, 0);
  tone(1320, 1760, 0.18, 'sine', 0.08, 0.07);
}

export function sndAlarmTick(level) {
  tone(1200 + level * 900, 1200 + level * 900, 0.05, 'square', 0.028, 0);
}

export function sndCaught() {
  tone(392, 196, 0.34, 'sawtooth', 0.14, 0);
  tone(311, 155, 0.42, 'sawtooth', 0.12, 0.16);
}

export function sndEmp() {
  tone(2400, 120, 0.3, 'sawtooth', 0.1, 0);
}

export function sndPickDone() {
  tone(660, 660, 0.07, 'triangle', 0.1, 0);
  tone(990, 990, 0.1, 'triangle', 0.1, 0.09);
}

export function sndBank() {
  tone(523, 523, 0.12, 'triangle', 0.12, 0);
  tone(659, 659, 0.12, 'triangle', 0.12, 0.1);
  tone(784, 784, 0.12, 'triangle', 0.12, 0.2);
  tone(1046, 1046, 0.3, 'triangle', 0.13, 0.3);
}

export function sndStep() {
  tone(190, 140, 0.045, 'sine', 0.02, 0);
}
