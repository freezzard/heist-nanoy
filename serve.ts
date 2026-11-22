// serve.ts — a pocket static server for play-testing the game locally:
//   node serve.ts [--port 8091]
// It serves only the game/ folder beside this file, refuses any path that
// climbs out of it, and knows the handful of content types a canvas game
// needs. A development convenience, nothing more.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const argv = process.argv.slice(2);
const portAt = argv.indexOf('--port');
const asked = portAt === -1 ? 8091 : Number(argv[portAt + 1]);
const port = Number.isInteger(asked) && asked > 0 && asked < 65536 ? asked : 8091;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  const rawPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const wanted = rawPath === '/' ? '/index.html' : rawPath;
  const filePath = normalize(join(gameRoot, wanted));
  const inside = filePath === gameRoot || filePath.startsWith(gameRoot + sep);
  if (!inside) {
    res.writeHead(403);
    res.end('outside the museum');
    return;
  }
  try { const info = statSync(filePath);
    if (!info.isFile()) throw new Error('not a file');
    res.writeHead(200, { 'content-type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream' });
    createReadStream(filePath).pipe(res);
  } catch (statErr) {
    res.writeHead(404);
    res.end('no such exhibit');
  }
});

server.listen(port, () => {
  console.log('The Gilded Vault is open at http://localhost:' + port);
});
