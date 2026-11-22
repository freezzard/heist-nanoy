// main.js — the page's bootstrap: canvas, keyboard and mouse, the frame loop,
// and the ?shot= staging hook the screenshots are taken through.

import { STAGE_H, STAGE_W } from './floorplan.js';
import { SCREEN_OVER, SCREEN_TITLE, SCREEN_WIN, makeNight, startRun, updateNight } from './heist.js';
import { drawNight } from './draw.js';
import { stageScene } from './staging.js';
import { isMuted, setMuted } from './soundboard.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
canvas.width = STAGE_W;
canvas.height = STAGE_H;

const night = makeNight();
const input = {
  up: false, down: false, left: false, right: false,
  sprint: false, pick: false, empPressed: false,
};

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyF: 'pick',
};

function beginIfNeeded() {
  if (night.screen === SCREEN_TITLE) startRun(night);
  if (night.screen === SCREEN_OVER || night.screen === SCREEN_WIN) startRun(night);
}

window.addEventListener('keydown', (event) => {
  const slot = KEYMAP[event.code];
  if (slot) {
    input[slot] = true;
    event.preventDefault();
  }
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.sprint = true;
  if (event.code === 'KeyE') input.empPressed = true;
  if (event.code === 'Enter') beginIfNeeded();
  if (event.code === 'KeyR') beginIfNeeded();
  if (event.code === 'KeyP' && night.screen === 'play') night.paused = !night.paused;
  if (event.code === 'KeyM') setMuted(!isMuted());
});

window.addEventListener('keyup', (event) => {
  const slot = KEYMAP[event.code];
  if (slot) input[slot] = false;
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.sprint = false;
});

canvas.addEventListener('pointerdown', () => {
  beginIfNeeded();
});

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) stageScene(night, shotName);

window.__night = night;
window.__input = input;

let lastStamp = performance.now();
function frame(nowStamp) {
  const rawDt = (nowStamp - lastStamp) / 1000;
  lastStamp = nowStamp;
  const dt = Math.min(0.033, Math.max(0, rawDt));
  updateNight(night, input, dt);
  input.empPressed = false;
  drawNight(ctx, night);
  window.requestAnimationFrame(frame);
}
window.requestAnimationFrame(frame);
