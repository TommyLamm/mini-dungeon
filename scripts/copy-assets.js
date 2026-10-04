import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

fs.copyFileSync(path.resolve('game.json'), path.join(dist, 'game.json'));
fs.copyFileSync(path.resolve('cover.png'), path.join(dist, 'cover.png'));

if (fs.existsSync(path.resolve('playroom-sdk.js'))) {
  fs.copyFileSync(path.resolve('playroom-sdk.js'), path.join(dist, 'playroom-sdk.js'));
}
if (fs.existsSync(path.resolve('playroom-sdk.d.ts'))) {
  fs.copyFileSync(path.resolve('playroom-sdk.d.ts'), path.join(dist, 'playroom-sdk.d.ts'));
}

console.log('Successfully copied game.json, cover.png, and Playroom SDK to dist/');
