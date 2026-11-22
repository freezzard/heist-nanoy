// sight.js — the geometry of being seen: angles, line of sight past walls and
// glass cases, and how strongly one watcher notices the thief right now.

import { CASE_RECTS, DUCT_ZONES, SHADOW_ZONES, WALL_RECTS, VAULT_DOOR } from './floorplan.js';

export function angleDelta(fromAngle, toAngle) {
  let delta = toAngle - fromAngle;
  const fullTurn = Math.PI * 2;
  const wrapped = ((delta + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;
  return wrapped;
}

export function pointInRect(px, py, rect) {
  const inside = px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  return inside;
}

export function thiefCover(thief) {
  let cover = 'open';
  for (let zi = 0; zi < DUCT_ZONES.length; zi += 1) {
    if (pointInRect(thief.x, thief.y, DUCT_ZONES[zi])) cover = 'duct';
  }
  if (cover !== 'duct') {
    for (let zi = 0; zi < SHADOW_ZONES.length; zi += 1) {
      if (pointInRect(thief.x, thief.y, SHADOW_ZONES[zi])) cover = 'shadow';
    }
  }
  return cover;
}

function segmentCrossesRect(x1, y1, x2, y2, rect) {
  // Sample the segment finely; the museum's walls are chunky, so 24 probes are honest.
  const steps = 24;
  let crossed = false;
  for (let si = 1; si < steps; si += 1) {
    const t = si / steps;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    if (pointInRect(px, py, rect)) crossed = true;
  }
  return crossed;
}

export function sightBlocked(x1, y1, x2, y2, doorShut) {
  let blocked = false;
  const solids = doorShut ? WALL_RECTS.concat(CASE_RECTS, [VAULT_DOOR]) : WALL_RECTS.concat(CASE_RECTS);
  for (let ri = 0; ri < solids.length; ri += 1) {
    if (segmentCrossesRect(x1, y1, x2, y2, solids[ri])) blocked = true;
  }
  return blocked;
}

/** Strength 0..1 of one watcher's notice; 0 means the thief is not seen at all. */
export function noticeStrength(watcher, thief, range, halfAngle, doorShut) {
  const noNotice = 0;
  const dx = thief.x - watcher.x;
  const dy = thief.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return noNotice;
  const bearing = Math.atan2(dy, dx);
  if (Math.abs(angleDelta(watcher.facing, bearing)) > halfAngle) return noNotice;
  if (sightBlocked(watcher.x, watcher.y, thief.x, thief.y, doorShut)) return noNotice;
  const closeness = 1 - (dist / range) * 0.55;
  return closeness;
}
