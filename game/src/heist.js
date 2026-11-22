// heist.js — one night at the museum as a state machine: the run's state, the
// per-frame update (movement, patrols, cameras, detection, alarm, loot, the
// lockpick, the EMP, banking the haul at the van) and the caught/win endings.

import {
  ALARM_DECAY, ALARM_FILL, CAMERA_HALF_ANGLE, CAMERA_SIGHT, EMP_CHARGES,
  EMP_SECONDS, GUARD_HALF_ANGLE, GUARD_SIGHT, HAUL_GOAL, LOOT_ITEMS,
  MAX_STRIKES, PICK_SECONDS, PICK_SPOT, THIEF_DUCT_SPEED, THIEF_SPEED,
  THIEF_SPRINT, THIEF_START, VAN_ZONE,
} from './floorplan.js';
import { makeCameras, makeGuards, makeThief, slideMove, updateCamera, updateGuard } from './people.js';
import { noticeStrength, pointInRect, thiefCover } from './sight.js';
import {
  sndAlarmTick, sndBank, sndCaught, sndEmp, sndPickDone, sndPickup, sndStep,
} from './soundboard.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function makeNight() {
  const loot = [];
  for (let li = 0; li < LOOT_ITEMS.length; li += 1) {
    const item = LOOT_ITEMS[li];
    loot.push({ id: item.id, name: item.name, value: item.value, x: item.x, y: item.y, hue: item.hue, taken: false });
  }
  const night = {
    screen: SCREEN_TITLE,
    thief: makeThief(THIEF_START),
    guards: makeGuards(),
    cameras: makeCameras(),
    loot,
    carried: [],
    banked: 0,
    alarm: 0,
    strikes: 0,
    empLeft: EMP_CHARGES,
    empDarkLeft: 0,
    doorOpen: false,
    pickProgress: 0,
    picking: false,
    time: 0,
    clock: 0,
    seenStrength: 0,
    caughtLeft: 0,
    tickClock: 0,
    stepClock: 0,
    message: '',
    messageLeft: 0,
    frozen: false,
    paused: false,
  };
  return night;
}

export function startRun(night) {
  const fresh = makeNight();
  night.thief = fresh.thief;
  night.guards = fresh.guards;
  night.cameras = fresh.cameras;
  night.loot = fresh.loot;
  night.carried = [];
  night.banked = 0;
  night.alarm = 0;
  night.strikes = 0;
  night.empLeft = EMP_CHARGES;
  night.empDarkLeft = 0;
  night.doorOpen = false;
  night.pickProgress = 0;
  night.time = 0;
  night.screen = SCREEN_PLAY;
  night.message = 'The museum sleeps. The Celestine Crown does not.';
  night.messageLeft = 3.4;
}

export function carriedValue(night) {
  let total = 0;
  for (let ci = 0; ci < night.carried.length; ci += 1) total += night.carried[ci].value;
  return total;
}

function say(night, text, seconds) {
  night.message = text;
  night.messageLeft = seconds;
}

function thiefSpeed(night, input) {
  let speed = THIEF_SPEED;
  if (night.thief.inDuct) speed = THIEF_DUCT_SPEED;
  if (input.sprint && !night.thief.inDuct) speed = THIEF_SPRINT;
  return speed;
}

function moveThief(night, input, dt) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  const mag = Math.hypot(mx, my);
  night.thief.moving = mag > 0 && !night.picking;
  if (night.thief.moving) {
    const speed = thiefSpeed(night, input);
    const ux = (mx / mag) * speed * dt;
    const uy = (my / mag) * speed * dt;
    slideMove(night.thief, ux, uy, !night.doorOpen);
    night.thief.facing = Math.atan2(my, mx);
    night.stepClock -= dt;
    if (night.stepClock <= 0) {
      sndStep();
      night.stepClock = input.sprint ? 0.24 : 0.34;
    }
  }
  night.thief.inDuct = thiefCover(night.thief) === 'duct';
  night.thief.sprinting = input.sprint && night.thief.moving;
}

function runDetection(night, dt) {
  const cover = thiefCover(night.thief);
  let strongest = 0;
  for (let gi = 0; gi < night.guards.length; gi += 1) {
    const guard = night.guards[gi];
    guard.alert = noticeStrength(guard, night.thief, GUARD_SIGHT, GUARD_HALF_ANGLE, !night.doorOpen);
    if (guard.alert > strongest) strongest = guard.alert;
  }
  for (let ci = 0; ci < night.cameras.length; ci += 1) {
    const camera = night.cameras[ci];
    camera.alert = 0;
    if (camera.darkLeft <= 0) {
      camera.alert = noticeStrength(camera, night.thief, CAMERA_SIGHT, CAMERA_HALF_ANGLE, !night.doorOpen);
      if (camera.alert > strongest) strongest = camera.alert;
    }
  }
  if (cover === 'duct') strongest = 0;
  let fillRate = ALARM_FILL * strongest;
  if (cover === 'shadow') fillRate *= 0.45;
  if (night.thief.sprinting) fillRate *= 1.7;
  night.seenStrength = strongest;
  if (strongest > 0.02) {
    night.alarm += fillRate * dt;
    night.tickClock -= dt;
    if (night.tickClock <= 0) {
      sndAlarmTick(night.alarm / 100);
      night.tickClock = 0.34 - (night.alarm / 100) * 0.2;
    }
  }
  if (strongest <= 0.02) night.alarm -= ALARM_DECAY * dt;
  night.alarm = Math.max(0, Math.min(100, night.alarm));
}

function tryLoot(night) {
  for (let li = 0; li < night.loot.length; li += 1) {
    const item = night.loot[li];
    if (!item.taken) {
      const dist = Math.hypot(item.x - night.thief.x, item.y - night.thief.y);
      if (dist < 30) {
        item.taken = true;
        night.carried.push(item);
        sndPickup();
        say(night, 'Lifted the ' + item.name + ' — $' + item.value + 'k on your back.', 2.6);
      }
    }
  }
}

function tryBank(night) {
  const atVan = pointInRect(night.thief.x, night.thief.y, VAN_ZONE);
  if (atVan && night.carried.length > 0) {
    const gained = carriedValue(night);
    night.banked += gained;
    night.carried = [];
    sndBank();
    say(night, 'Banked $' + gained + 'k. Haul so far: $' + night.banked + 'k of $' + HAUL_GOAL + 'k.', 3);
    if (night.banked >= HAUL_GOAL) night.screen = SCREEN_WIN;
  }
}

function tryPick(night, input, dt) {
  const near = Math.hypot(PICK_SPOT.x - night.thief.x, PICK_SPOT.y - night.thief.y) < 42;
  night.picking = input.pick && near && !night.doorOpen;
  if (night.picking) {
    night.pickProgress += dt;
    if (night.pickProgress >= PICK_SECONDS) {
      night.doorOpen = true;
      night.picking = false;
      sndPickDone();
      say(night, 'The vault door sighs open. The Crown is inside.', 3);
    }
  }
  if (!night.picking && !night.doorOpen) night.pickProgress = Math.max(0, night.pickProgress - dt * 1.6);
}

function fireEmp(night) {
  if (night.empLeft > 0 && night.empDarkLeft <= 0) {
    night.empLeft -= 1;
    night.empDarkLeft = EMP_SECONDS;
    for (let ci = 0; ci < night.cameras.length; ci += 1) night.cameras[ci].darkLeft = EMP_SECONDS;
    sndEmp();
    say(night, 'EMP pulse — every camera is blind for ' + EMP_SECONDS + ' seconds.', 2.4);
  }
}

function beCaught(night) {
  night.strikes += 1;
  night.screen = SCREEN_CAUGHT;
  night.caughtLeft = 1.9;
  sndCaught();
}

function afterCaught(night) {
  if (night.strikes >= MAX_STRIKES) {
    night.screen = SCREEN_OVER;
    return;
  }
  night.thief = makeThief(THIEF_START);
  night.carried = [];
  night.alarm = 22;
  night.pickProgress = 0;
  night.screen = SCREEN_PLAY;
  say(night, 'Dragged back to the entry hall. What you carried is gone; what you banked is safe.', 3.6);
}

export function updateNight(night, input, dt) {
  if (night.frozen || night.paused) return;
  night.clock += dt;
  if (night.messageLeft > 0) night.messageLeft -= dt;
  if (night.screen === SCREEN_CAUGHT) {
    night.caughtLeft -= dt;
    if (night.caughtLeft <= 0) afterCaught(night);
    return;
  }
  if (night.screen !== SCREEN_PLAY) return;
  night.time += dt;
  if (night.empDarkLeft > 0) night.empDarkLeft -= dt;
  if (input.empPressed) fireEmp(night);
  tryPick(night, input, dt);
  moveThief(night, input, dt);
  for (let gi = 0; gi < night.guards.length; gi += 1) updateGuard(night.guards[gi], dt);
  for (let ci = 0; ci < night.cameras.length; ci += 1) updateCamera(night.cameras[ci], dt, night.empDarkLeft > 0);
  runDetection(night, dt);
  tryLoot(night);
  tryBank(night);
  if (night.alarm >= 100) beCaught(night);
}
