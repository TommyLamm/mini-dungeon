import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

fs.copyFileSync(path.resolve('game.json'), path.join(dist, 'game.json'));
fs.copyFileSync(path.resolve('cover.png'), path.join(dist, 'cover.png'));
console.log('Successfully copied game.json and cover.png to dist/');
