// people.js — the night staff and the thief: patrol walking with pauses whose
// gaze sweeps the room, camera heads swinging on their mounts, and
// circle-versus-wall motion that slides along whatever it meets.

import {
  CAMERA_POSTS, GUARD_PAUSE_SWEEP, GUARD_RADIUS, GUARD_ROUTES, GUARD_SPEED,
  THIEF_RADIUS,
} from './floorplan.js';
import { angleDelta, solidsList } from './sight.js';

export function makeThief(start) {
  const thief = {
    x: start.x, y: start.y, radius: THIEF_RADIUS,
    facing: -Math.PI / 2, moving: false, sprinting: false, inDuct: false,
  };
  return thief;
}

export function makeGuards() {
  const guards = [];
  for (let gi = 0; gi < GUARD_ROUTES.length; gi += 1) {
    const post = GUARD_ROUTES[gi];
    const firstFacing = Math.atan2(post.route[1][1] - post.route[0][1], post.route[1][0] - post.route[0][0]);
    guards.push({
      name: post.name, route: post.route, leg: 0, pauseLeft: 0,
      x: post.route[0][0], y: post.route[0][1], radius: GUARD_RADIUS,
      facing: firstFacing, faceBase: firstFacing,
      sweepPhase: gi * 1.7, alert: 0,
    });
  }
  return guards;
}

export function makeCameras() {
  const cameras = [];
  for (let ci = 0; ci < CAMERA_POSTS.length; ci += 1) {
    const post = CAMERA_POSTS[ci];
    cameras.push({
      name: post.name, x: post.x, y: post.y, base: post.base,
      sweep: post.sweep, speed: post.speed, facing: post.base, darkLeft: 0, alert: 0,
    });
  }
  return cameras;
}

function pushOutOfRect(mover, rect) {
  const nearX = Math.max(rect.x, Math.min(mover.x, rect.x + rect.w));
  const nearY = Math.max(rect.y, Math.min(mover.y, rect.y + rect.h));
  const dx = mover.x - nearX;
  const dy = mover.y - nearY;
  const distSq = dx * dx + dy * dy;
  if (distSq < mover.radius * mover.radius) {
    const dist = Math.sqrt(distSq);
    if (dist > 0.001) {
      mover.x = nearX + (dx / dist) * mover.radius;
      mover.y = nearY + (dy / dist) * mover.radius;
    }
    if (dist <= 0.001) mover.y = rect.y - mover.radius;
  }
}

/** Move a circle by (dx, dy), sliding along every solid it meets. */
export function slideMove(mover, dx, dy, doorShut) {
  mover.x += dx;
  mover.y += dy;
  const solids = solidsList(doorShut);
  for (let pass = 0; pass < 2; pass += 1) {
    for (let ri = 0; ri < solids.length; ri += 1) pushOutOfRect(mover, solids[ri]);
  }
}

export function updateGuard(guard, dt) {
  if (guard.pauseLeft > 0) {
    // Paused at a waypoint: the body rests, the gaze does not. The cone swings
    // across the room and back — read the swing before you cross.
    guard.pauseLeft -= dt;
    guard.sweepPhase += dt * 1.55;
    guard.facing = guard.faceBase + Math.sin(guard.sweepPhase) * GUARD_PAUSE_SWEEP;
    return;
  }
  const goal = guard.route[(guard.leg + 1) % guard.route.length];
  const dx = goal[0] - guard.x;
  const dy = goal[1] - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) {
    guard.leg = (guard.leg + 1) % guard.route.length;
    guard.pauseLeft = 1.3;
    guard.sweepPhase = 0;
    guard.faceBase = guard.facing;
    return;
  }
  const step = Math.min(dist, GUARD_SPEED * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  const wanted = Math.atan2(dy, dx);
  guard.facing += angleDelta(guard.facing, wanted) * Math.min(1, dt * 7);
}

export function updateCamera(camera, dt, nowSeconds) {
  if (camera.darkLeft > 0) camera.darkLeft -= dt;
  const swing = Math.sin(nowSeconds * camera.speed) * camera.sweep;
  camera.facing = camera.base + swing;
}
