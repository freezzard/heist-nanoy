// draw.js — everything the player sees, painted on one canvas: the museum floor
// with its rugs, ducts, cases and labels, vision cones that stop at walls, the
// staff and the thief, the HUD with its alarm meter, and the night's screens.
// Safe cover reads blue, danger reads amber and red, loot reads gold.

import {
  CAMERA_HALF_ANGLE, CAMERA_SIGHT, CASE_RECTS, DUCT_ZONES, GUARD_HALF_ANGLE,
  GUARD_SIGHT, HAUL_GOAL, HUD_H, MAX_STRIKES, PICK_SECONDS, PICK_SPOT,
  ROOM_LABELS, SHADOW_ZONES, STAGE_H, STAGE_W, VAULT_DOOR, VAN_ZONE, WALL_RECTS,
} from './floorplan.js';
import { SCREEN_CAUGHT, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, carriedValue } from './heist.js';
import { pointInRect, solidsList } from './sight.js';

const INK = '#e8e4d8';
const DIM = '#9aa3b5';
const GOLD = '#d9a441';

function rayReach(x, y, angle, maxDist, solids) {
  const stepLen = 5;
  let reach = maxDist;
  const steps = Math.floor(maxDist / stepLen);
  for (let si = 1; si <= steps; si += 1) {
    const px = x + Math.cos(angle) * si * stepLen;
    const py = y + Math.sin(angle) * si * stepLen;
    let hit = false;
    for (let ri = 0; ri < solids.length; ri += 1) {
      if (pointInRect(px, py, solids[ri])) hit = true;
    }
    if (hit) {
      reach = si * stepLen;
      return reach;
    }
  }
  return reach;
}

function drawCone(ctx, watcher, range, halfAngle, colour, doorShut) {
  const solids = solidsList(doorShut);
  const rays = 26;
  ctx.beginPath();
  ctx.moveTo(watcher.x, watcher.y);
  for (let ri = 0; ri <= rays; ri += 1) {
    const angle = watcher.facing - halfAngle + (2 * halfAngle * ri) / rays;
    const reach = rayReach(watcher.x, watcher.y, angle, range, solids);
    ctx.lineTo(watcher.x + Math.cos(angle) * reach, watcher.y + Math.sin(angle) * reach);
  }
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.strokeStyle = colour;
  ctx.globalAlpha = 0.35;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawFloor(ctx, night) {
  ctx.fillStyle = '#232839';
  ctx.fillRect(0, HUD_H, STAGE_W, STAGE_H - HUD_H);
  ctx.fillStyle = '#2b3249';
  ctx.fillRect(16, 80, 404, 390);
  ctx.fillRect(876, 80, 388, 390);
  ctx.fillStyle = '#313a56';
  ctx.fillRect(436, 80, 424, 390);
  // Skylight sheen across the atrium: two soft diagonal bands.
  ctx.save();
  ctx.beginPath();
  ctx.rect(436, 80, 424, 390);
  ctx.clip();
  ctx.fillStyle = 'rgba(190,215,255,0.05)';
  ctx.beginPath();
  ctx.moveTo(470, 470);
  ctx.lineTo(640, 80);
  ctx.lineTo(740, 80);
  ctx.lineTo(570, 470);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(620, 470);
  ctx.lineTo(790, 80);
  ctx.lineTo(850, 80);
  ctx.lineTo(680, 470);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#3a3122';
  ctx.fillRect(594, 94, 132, 142);
  ctx.fillStyle = '#262c3f';
  ctx.fillRect(16, 486, 1248, 298);
  ctx.strokeStyle = 'rgba(217,164,65,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 84, 1240, 696);
  ctx.lineWidth = 1;
}

function drawZones(ctx) {
  for (let zi = 0; zi < SHADOW_ZONES.length; zi += 1) {
    const zone = SHADOW_ZONES[zi];
    ctx.fillStyle = '#1d2f4a';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = 'rgba(120,170,255,0.25)';
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.font = '600 10px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(160,195,255,0.45)';
    ctx.fillText('DEEP RUG — MUFFLED', zone.x + 8, zone.y + 16);
  }
  for (let zi = 0; zi < DUCT_ZONES.length; zi += 1) {
    const zone = DUCT_ZONES[zi];
    ctx.fillStyle = '#14161c';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = '#4a5064';
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.beginPath();
    const bars = Math.floor(Math.max(zone.w, zone.h) / 14);
    for (let bi = 1; bi < bars; bi += 1) {
      if (zone.w >= zone.h) {
        ctx.moveTo(zone.x + bi * 14, zone.y + 3);
        ctx.lineTo(zone.x + bi * 14, zone.y + zone.h - 3);
      }
      if (zone.w < zone.h) {
        ctx.moveTo(zone.x + 3, zone.y + bi * 14);
        ctx.lineTo(zone.x + zone.w - 3, zone.y + bi * 14);
      }
    }
    ctx.stroke();
  }
  ctx.font = '600 10px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(200,205,220,0.5)';
  ctx.fillText('DUCT', DUCT_ZONES[0].x + 8, DUCT_ZONES[0].y - 6);
}

function drawSolids(ctx, night) {
  ctx.fillStyle = '#0f1118';
  for (let ri = 0; ri < WALL_RECTS.length; ri += 1) {
    const rect = WALL_RECTS[ri];
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  for (let ri = 0; ri < CASE_RECTS.length; ri += 1) {
    const rect = CASE_RECTS[ri];
    ctx.fillStyle = '#39415c';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(170,220,255,0.30)';
    ctx.fillRect(rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 10);
  }
  if (!night.doorOpen) {
    ctx.fillStyle = '#8a6a1f';
    ctx.fillRect(VAULT_DOOR.x, VAULT_DOOR.y, VAULT_DOOR.w, VAULT_DOOR.h);
    ctx.fillStyle = GOLD;
    ctx.fillRect(VAULT_DOOR.x + 21, VAULT_DOOR.y + 4, 6, 6);
  }
  if (night.doorOpen) {
    ctx.fillStyle = 'rgba(217,164,65,0.25)';
    ctx.fillRect(VAULT_DOOR.x, VAULT_DOOR.y, VAULT_DOOR.w, VAULT_DOOR.h);
  }
}

function drawLabels(ctx) {
  ctx.font = '600 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(232,228,216,0.34)';
  for (let li = 0; li < ROOM_LABELS.length; li += 1) {
    const label = ROOM_LABELS[li];
    ctx.fillText(label.text, label.x, label.y);
  }
}

function drawLoot(ctx, night) {
  for (let li = 0; li < night.loot.length; li += 1) {
    const item = night.loot[li];
    ctx.fillStyle = '#454f6e';
    ctx.fillRect(item.x - 17, item.y - 12, 34, 24);
    ctx.strokeStyle = 'rgba(232,228,216,0.25)';
    ctx.strokeRect(item.x - 17, item.y - 12, 34, 24);
    if (!item.taken) {
      const twinkle = 1 + 0.18 * Math.sin(night.clock * 3 + li * 1.3);
      ctx.save();
      ctx.translate(item.x, item.y - 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = item.hue;
      const gem = 7 * twinkle;
      ctx.fillRect(-gem, -gem, gem * 2, gem * 2);
      ctx.restore();
      ctx.font = '600 11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = INK;
      ctx.fillText(item.name, item.x, item.y + 26);
      ctx.fillStyle = GOLD;
      ctx.fillText('$' + item.value + 'k', item.x, item.y + 40);
    }
    if (item.taken) {
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(154,163,181,0.5)';
      ctx.fillText('empty', item.x, item.y + 26);
    }
  }
}

function drawVan(ctx) {
  ctx.fillStyle = '#101319';
  ctx.fillRect(VAN_ZONE.x, VAN_ZONE.y, VAN_ZONE.w, VAN_ZONE.h);
  ctx.fillStyle = '#3f6d4e';
  ctx.fillRect(VAN_ZONE.x + 6, VAN_ZONE.y + 6, VAN_ZONE.w - 12, VAN_ZONE.h - 12);
  ctx.font = '700 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.fillText('GETAWAY VAN', VAN_ZONE.x + VAN_ZONE.w / 2, VAN_ZONE.y + 29);
}

function drawShadowBlob(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.8, r * 1.05, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, guard) {
  drawShadowBlob(ctx, guard.x, guard.y, guard.radius);
  ctx.fillStyle = '#2c4a7c';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16283f';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.radius - 5, 0, Math.PI * 2);
  ctx.fill();
  const brimX = guard.x + Math.cos(guard.facing) * 12;
  const brimY = guard.y + Math.sin(guard.facing) * 12;
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.arc(brimX, brimY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '600 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = DIM;
  ctx.fillText(guard.name, guard.x, guard.y + 30);
  if (guard.alert > 0.03) {
    ctx.font = '900 20px Georgia, serif';
    ctx.fillStyle = guard.alert > 0.6 ? '#ff5347' : '#ffb347';
    ctx.fillText('!', guard.x, guard.y - 22);
  }
}

function drawCamera(ctx, camera) {
  ctx.fillStyle = '#0f1118';
  ctx.fillRect(camera.x - 10, camera.y - 10, 20, 20);
  const lensX = camera.x + Math.cos(camera.facing) * 9;
  const lensY = camera.y + Math.sin(camera.facing) * 9;
  ctx.fillStyle = camera.darkLeft > 0 ? '#3a3f4d' : '#ff5347';
  ctx.beginPath();
  ctx.arc(lensX, lensY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '600 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = DIM;
  const label = camera.darkLeft > 0 ? camera.name + ' · DARK' : camera.name;
  ctx.fillText(label, camera.x, camera.y + 26);
}

function drawThief(ctx, night) {
  const thief = night.thief;
  drawShadowBlob(ctx, thief.x, thief.y, thief.radius);
  ctx.fillStyle = '#123f3a';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = thief.inDuct ? '#14524a' : '#1d6a5f';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.radius, 0, Math.PI * 2);
  ctx.fill();
  const hoodX = thief.x + Math.cos(thief.facing) * 6;
  const hoodY = thief.y + Math.sin(thief.facing) * 6;
  ctx.fillStyle = '#0d2f2a';
  ctx.beginPath();
  ctx.arc(hoodX, hoodY, 7, 0, Math.PI * 2);
  ctx.fill();
  if (night.carried.length > 0) {
    ctx.fillStyle = '#b98a2f';
    ctx.beginPath();
    ctx.arc(thief.x - Math.cos(thief.facing) * 10, thief.y - Math.sin(thief.facing) * 10, 5 + night.carried.length, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = '600 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.fillText('WREN', thief.x, thief.y + 31);
}

function drawPickGauge(ctx, night) {
  if (!night.doorOpen) {
    const near = Math.hypot(PICK_SPOT.x - night.thief.x, PICK_SPOT.y - night.thief.y) < 60;
    if (near) {
      ctx.font = '600 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = GOLD;
      ctx.fillText('HOLD F — PICK THE VAULT LOCK', PICK_SPOT.x, PICK_SPOT.y + 34);
      if (night.pickProgress > 0) {
        const frac = Math.min(1, night.pickProgress / PICK_SECONDS);
        ctx.fillStyle = '#14161c';
        ctx.fillRect(PICK_SPOT.x - 40, PICK_SPOT.y + 42, 80, 8);
        ctx.fillStyle = GOLD;
        ctx.fillRect(PICK_SPOT.x - 40, PICK_SPOT.y + 42, 80 * frac, 8);
      }
    }
  }
}

function drawHud(ctx, night) {
  ctx.fillStyle = '#0b0d12';
  ctx.fillRect(0, 0, STAGE_W, HUD_H);
  ctx.strokeStyle = 'rgba(217,164,65,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, HUD_H - 1);
  ctx.lineTo(STAGE_W, HUD_H - 1);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = '700 19px Georgia, serif';
  ctx.fillStyle = INK;
  ctx.fillText('HAUL $' + night.banked + 'k / $' + HAUL_GOAL + 'k', 18, 28);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = GOLD;
  ctx.fillText('on your back: $' + carriedValue(night) + 'k', 18, 50);
  // The alarm meter: the one bar the whole night hangs on.
  const barX = 470;
  const barW = 340;
  ctx.font = '700 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = night.alarm > 70 ? '#ff5347' : INK;
  ctx.fillText('— ALARM —', barX + barW / 2, 20);
  ctx.fillStyle = '#1c1f27';
  ctx.fillRect(barX, 28, barW, 20);
  const alarmW = (barW * night.alarm) / 100;
  ctx.fillStyle = night.alarm > 70 ? '#ff5347' : night.alarm > 35 ? '#ffb347' : '#57c9a3';
  ctx.fillRect(barX, 28, alarmW, 20);
  ctx.strokeStyle = 'rgba(232,228,216,0.4)';
  ctx.strokeRect(barX, 28, barW, 20);
  ctx.textAlign = 'right';
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = INK;
  let empText = 'EMP ';
  for (let ei = 0; ei < 3; ei += 1) empText += ei < night.empLeft ? '●' : '○';
  ctx.fillText(empText, 1050, 28);
  let strikeText = 'strikes ';
  for (let si = 0; si < MAX_STRIKES; si += 1) strikeText += si < night.strikes ? '✕' : '·';
  ctx.fillText(strikeText, 1050, 50);
  const mm = String(Math.floor(night.time / 60)).padStart(2, '0');
  const ss = String(Math.floor(night.time % 60)).padStart(2, '0');
  ctx.font = '700 19px Georgia, serif';
  ctx.fillText(mm + ':' + ss, 1262, 40);
}

function drawHint(ctx, night) {
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'center';
  if (night.messageLeft > 0) {
    ctx.fillStyle = 'rgba(11,13,18,0.78)';
    const w = ctx.measureText(night.message).width + 28;
    ctx.fillRect(640 - w / 2, STAGE_H - 40, w, 26);
    ctx.fillStyle = INK;
    ctx.fillText(night.message, 640, STAGE_H - 22);
    return;
  }
  ctx.fillStyle = 'rgba(154,163,181,0.85)';
  let hint = 'WASD / arrows — move · SHIFT — sprint (loud) · E — EMP pulse · F — pick lock · P — pause · M — mute';
  if (night.carried.length > 0) hint = 'You are carrying $' + carriedValue(night) + 'k — reach the GETAWAY VAN at the south door to bank it.';
  if (night.thief.inDuct) hint = 'In the duct: slow, and no eyes can find you here.';
  ctx.fillText(hint, 640, STAGE_H - 22);
}

function drawVignette(ctx, night) {
  if (night.alarm > 50 && night.screen === SCREEN_PLAY) {
    const pulse = 0.10 + 0.06 * Math.sin(night.clock * 9);
    const alpha = pulse * ((night.alarm - 50) / 50);
    ctx.strokeStyle = 'rgba(255,60,40,' + alpha.toFixed(3) + ')';
    ctx.lineWidth = 26;
    ctx.strokeRect(0, HUD_H, STAGE_W, STAGE_H - HUD_H);
    ctx.lineWidth = 1;
  }
}

function banner(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(7,8,12,0.82)';
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = '700 54px Georgia, serif';
  ctx.fillText(title, 640, 268);
  ctx.font = '17px Georgia, serif';
  ctx.fillStyle = INK;
  for (let li = 0; li < lines.length; li += 1) ctx.fillText(lines[li], 640, 330 + li * 27);
}

export function drawNight(ctx, night) {
  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
  drawFloor(ctx, night);
  drawZones(ctx);
  drawLabels(ctx);
  drawLoot(ctx, night);
  drawVan(ctx);
  drawSolids(ctx, night);
  const doorShut = !night.doorOpen;
  for (let gi = 0; gi < night.guards.length; gi += 1) {
    const guard = night.guards[gi];
    drawCone(ctx, guard, GUARD_SIGHT, GUARD_HALF_ANGLE, guard.alert > 0.03 ? 'rgba(255,120,60,0.30)' : 'rgba(255,190,80,0.20)', doorShut);
  }
  for (let ci = 0; ci < night.cameras.length; ci += 1) {
    const camera = night.cameras[ci];
    if (camera.darkLeft <= 0) drawCone(ctx, camera, CAMERA_SIGHT, CAMERA_HALF_ANGLE, camera.alert > 0.03 ? 'rgba(255,90,120,0.28)' : 'rgba(120,200,255,0.16)', doorShut);
  }
  for (let gi = 0; gi < night.guards.length; gi += 1) drawGuard(ctx, night.guards[gi]);
  for (let ci = 0; ci < night.cameras.length; ci += 1) drawCamera(ctx, night.cameras[ci]);
  drawThief(ctx, night);
  drawPickGauge(ctx, night);
  drawHud(ctx, night);
  drawHint(ctx, night);
  drawVignette(ctx, night);
  if (night.screen === SCREEN_TITLE) {
    banner(ctx, 'THE GILDED VAULT', [
      'Tonight Wren robs the Vane Museum of Wonders.',
      'Lift $' + HAUL_GOAL + 'k of treasure and bank it at the getaway van — the Celestine Crown alone is $250k.',
      'Read the cones before you move. Blue rugs muffle you; ducts hide you; an EMP blinds cameras, briefly.',
      'Fill the alarm and you are caught: three strikes end the night.',
      '',
      'WASD / arrows move · SHIFT sprint · E EMP · F pick the vault lock',
      'Click here, or press ENTER, to begin the night.',
    ], GOLD);
  }
  if (night.screen === SCREEN_CAUGHT) {
    ctx.fillStyle = 'rgba(160,20,10,0.34)';
    ctx.fillRect(0, HUD_H, STAGE_W, STAGE_H - HUD_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd9d4';
    ctx.font = '700 46px Georgia, serif';
    ctx.fillText('SPOTTED!', 640, 420);
    ctx.font = '17px Georgia, serif';
    ctx.fillText('The alarm peaked — the guards have Wren. Strike ' + night.strikes + ' of ' + MAX_STRIKES + '.', 640, 458);
  }
  if (night.screen === SCREEN_OVER) {
    banner(ctx, 'THE NIGHT IS OVER', [
      'Three strikes. The museum keeps its treasure — this time.',
      'Banked before the fall: $' + night.banked + 'k.',
      'Press R, or click, to try another night.',
    ], '#ff5347');
  }
  if (night.screen === SCREEN_WIN) {
    banner(ctx, 'CLEAN GETAWAY', [
      'Wren vanishes into the wet streets with $' + night.banked + 'k of the Vane collection.',
      'Time on the floor: ' + Math.floor(night.time / 60) + 'm ' + Math.floor(night.time % 60) + 's · Strikes: ' + night.strikes,
      'Press R, or click, to rob it again.',
    ], '#57c9a3');
  }
  if (night.paused && night.screen === SCREEN_PLAY) {
    ctx.fillStyle = 'rgba(7,8,12,0.55)';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = '700 34px Georgia, serif';
    ctx.fillText('PAUSED — P to resume', 640, 420);
  }
}
