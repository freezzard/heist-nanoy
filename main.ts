// The Gilded Vault — hand-in program (Node 22, standard library only).
//
// The game itself is the static bundle under game/: plain files a desktop
// browser opens offline, no build step and no network. This program's whole
// job is the hand-in — copy game/ and screenshots/ into the output directory
// and write the dossier the judge reads, using the vendored library exactly
// as it ships. Outside the grader, an environment variable names the output
// directory in place of the grader's own /output path.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// The dossier caps mirror the gate's own: at most 4 screenshots of at most
// 256 KiB, at most 993 entries and 48 MiB under game/, no path over 1,000
// bytes, and the dossier text itself capped at 160 KiB.
const dossierText = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossierText);
