// floorplan.js — the Vane Museum of Wonders, drawn as data: walls, doors, ducts,
// shadow rugs, display cases, loot pedestals, patrol routes and camera posts.
// Every other module reads the night from these tables and never invents its own.

export const STAGE_W = 1280;
export const STAGE_H = 800;
export const HUD_H = 64;

export const HAUL_GOAL = 300;
export const THIEF_SPEED = 148;
export const THIEF_SPRINT = 228;
export const THIEF_DUCT_SPEED = 84;
export const THIEF_RADIUS = 13;
export const GUARD_SPEED = 57;
export const GUARD_RADIUS = 14;
export const GUARD_SIGHT = 178;
export const GUARD_HALF_ANGLE = 0.56;
export const CAMERA_SIGHT = 168;
export const CAMERA_HALF_ANGLE = 0.44;
export const ALARM_FILL = 33;
export const ALARM_DECAY = 9.5;
export const PICK_SECONDS = 2.5;
export const EMP_SECONDS = 6;
export const EMP_CHARGES = 3;
export const MAX_STRIKES = 3;

// Solid rectangles: x, y, w, h. The vault door is listed apart because it can open.
export const WALL_RECTS = [
  { x: 0, y: 64, w: 1280, h: 16 },
  { x: 0, y: 784, w: 1280, h: 16 },
  { x: 0, y: 64, w: 16, h: 736 },
  { x: 1264, y: 64, w: 16, h: 736 },
  { x: 420, y: 80, w: 16, h: 24 },
  { x: 420, y: 134, w: 16, h: 116 },
  { x: 420, y: 310, w: 16, h: 160 },
  { x: 860, y: 80, w: 16, h: 24 },
  { x: 860, y: 134, w: 16, h: 116 },
  { x: 860, y: 310, w: 16, h: 160 },
  { x: 16, y: 470, w: 164, h: 16 },
  { x: 260, y: 470, w: 330, h: 16 },
  { x: 670, y: 470, w: 90, h: 16 },
  { x: 790, y: 470, w: 220, h: 16 },
  { x: 1090, y: 470, w: 174, h: 16 },
  { x: 580, y: 80, w: 14, h: 24 },
  { x: 580, y: 134, w: 14, h: 102 },
  { x: 726, y: 80, w: 14, h: 156 },
  { x: 580, y: 236, w: 56, h: 14 },
  { x: 684, y: 236, w: 56, h: 14 },
];

// The locked vault door: solid until Wren picks it, then gone for the night.
export const VAULT_DOOR = { x: 636, y: 236, w: 48, h: 14 };
export const PICK_SPOT = { x: 660, y: 272 };

// Grated crawl ducts: slow, and no watcher can see a thief inside one.
export const DUCT_ZONES = [
  { x: 414, y: 104, w: 180, h: 30 },
  { x: 752, y: 438, w: 42, h: 82 },
];

// Deep pile rugs: standing on one halves how fast the alarm climbs.
export const SHADOW_ZONES = [
  { x: 140, y: 556, w: 230, h: 132 },
  { x: 524, y: 540, w: 232, h: 138 },
  { x: 910, y: 556, w: 230, h: 132 },
];

// Glass display cases: solid, and they block a watcher's line of sight.
export const CASE_RECTS = [
  { x: 92, y: 178, w: 92, h: 44 },
  { x: 238, y: 330, w: 92, h: 44 },
  { x: 952, y: 178, w: 92, h: 44 },
  { x: 1092, y: 330, w: 92, h: 44 },
  { x: 470, y: 330, w: 82, h: 40 },
  { x: 748, y: 330, w: 82, h: 40 },
  { x: 300, y: 616, w: 108, h: 40 },
  { x: 872, y: 616, w: 108, h: 40 },
];

export const LOOT_ITEMS = [
  { id: 'opal', name: 'Sun Opal', value: 70, x: 138, y: 160, hue: '#ffb347' },
  { id: 'abacus', name: 'Ivory Abacus', value: 40, x: 284, y: 312, hue: '#f3e5c0' },
  { id: 'pearl', name: 'Moon Pearl Strand', value: 65, x: 998, y: 160, hue: '#dfe9ff' },
  { id: 'astrolabe', name: 'Brass Astrolabe', value: 45, x: 1138, y: 312, hue: '#d9a441' },
  { id: 'idol', name: 'Verdigris Idol', value: 55, x: 511, y: 312, hue: '#57c9a3' },
  { id: 'nightjar', name: 'Porcelain Nightjar', value: 60, x: 789, y: 312, hue: '#9db8ff' },
  { id: 'crown', name: 'Celestine Crown', value: 250, x: 660, y: 152, hue: '#ffd94d' },
];

export const GUARD_ROUTES = [
  { name: 'Bruno', route: [[110, 400], [330, 400], [330, 296], [110, 296]] },
  { name: 'Petra', route: [[500, 428], [824, 428], [824, 300], [500, 300]] },
  { name: 'Silas', route: [[150, 706], [1130, 706], [1130, 596], [150, 596]] },
];

export const CAMERA_POSTS = [
  { name: 'Cam A', x: 884, y: 118, base: 2.62, sweep: 0.62, speed: 0.55 },
  { name: 'Cam B', x: 1136, y: 448, base: -1.62, sweep: 0.5, speed: 0.7 },
];

export const ROOM_LABELS = [
  { text: 'WEST GALLERY', x: 218, y: 462 },
  { text: 'GRAND ATRIUM', x: 648, y: 462 },
  { text: 'EAST GALLERY', x: 1062, y: 462 },
  { text: 'ENTRY HALL', x: 640, y: 528 },
  { text: 'THE VAULT', x: 660, y: 226 },
];

export const VAN_ZONE = { x: 586, y: 736, w: 108, h: 46 };
export const THIEF_START = { x: 640, y: 700 };
