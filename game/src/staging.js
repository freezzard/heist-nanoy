// staging.js — deterministic scenes for the entry's screenshots. Each scene
// starts a real run, then places the cast mid-action and freezes the clock, so
// the frame the camera takes is the game's own render of a genuine position:
// same floor, same cones, same rules — only the moment is chosen.
//
//   cover    Wren crosses the atrium with the Idol, two cones closing in
//   vault    Wren picks the vault lock under Petra's patrol, Crown in sight
//   alarm    Bruno's cone has her: alarm at 86, one breath from caught
//   getaway  Crown on her back, one step from the van, haul nearly home

import { SCREEN_PLAY, startRun } from './heist.js';

function placeGuard(night, index, x, y, facing, alert) {
  const guard = night.guards[index];
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.faceBase = facing;
  guard.alert = alert;
  guard.pauseLeft = 2;
}

function placeCamera(night, index, facing) {
  const camera = night.cameras[index];
  camera.facing = facing;
  camera.darkLeft = 0;
  camera.alert = 0;
}

function lift(night, id) {
  for (let li = 0; li < night.loot.length; li += 1) {
    const item = night.loot[li];
    if (item.id === id) {
      item.taken = true;
      night.carried.push(item);
    }
  }
}

function emptyPedestal(night, id) {
  for (let li = 0; li < night.loot.length; li += 1) {
    if (night.loot[li].id === id) night.loot[li].taken = true;
  }
}

function stageCover(night) {
  night.thief.x = 618;
  night.thief.y = 402;
  night.thief.facing = 0.5;
  lift(night, 'idol');
  night.alarm = 47;
  placeGuard(night, 0, 268, 292, 0.5, 0);
  placeGuard(night, 1, 782, 372, 2.75, 0.35);
  placeGuard(night, 2, 356, 690, 0.15, 0);
  placeCamera(night, 0, 2.95);
  placeCamera(night, 1, -1.25);
}

function stageVault(night) {
  night.thief.x = 660;
  night.thief.y = 274;
  night.thief.facing = -Math.PI / 2;
  night.picking = true;
  night.pickProgress = 1.35;
  night.alarm = 26;
  placeGuard(night, 0, 200, 380, 1.2, 0);
  placeGuard(night, 1, 548, 316, -1.9, 0.2);
  placeGuard(night, 2, 1080, 690, 3.0, 0);
  placeCamera(night, 0, 2.35);
  placeCamera(night, 1, -1.7);
}

function stageAlarm(night) {
  night.thief.x = 336;
  night.thief.y = 330;
  night.thief.facing = 0.2;
  lift(night, 'abacus');
  night.alarm = 86;
  placeGuard(night, 0, 232, 300, 0.28, 0.85);
  placeGuard(night, 1, 700, 420, 2.4, 0);
  placeGuard(night, 2, 900, 620, 3.1, 0);
  placeCamera(night, 0, 2.8);
  placeCamera(night, 1, -1.5);
}

function stageGetaway(night) {
  night.thief.x = 640;
  night.thief.y = 706;
  night.thief.facing = Math.PI / 2;
  lift(night, 'crown');
  lift(night, 'nightjar');
  emptyPedestal(night, 'opal');
  night.banked = 70;
  night.alarm = 18;
  night.time = 204;
  placeGuard(night, 0, 180, 320, 0.9, 0);
  placeGuard(night, 1, 620, 330, 1.8, 0);
  placeGuard(night, 2, 1052, 668, 3.05, 0);
  placeCamera(night, 0, 2.7);
  placeCamera(night, 1, -1.4);
}

const SCENES = {
  cover: stageCover,
  vault: stageVault,
  alarm: stageAlarm,
  getaway: stageGetaway,
};

export function stageScene(night, name) {
  const scene = SCENES[name];
  if (scene) {
    startRun(night);
    scene(night);
    night.screen = SCREEN_PLAY;
    night.messageLeft = 0;
    night.frozen = true;
  }
  return night;
}
