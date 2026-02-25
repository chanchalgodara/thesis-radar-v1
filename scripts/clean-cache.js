import { rmSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();

const dirs = [
  join(cwd, 'node_modules', '.vite-temp'),
  join(cwd, 'node_modules', '.vite'),
  join(cwd, '.next'),
  join(cwd, 'dist'),
];

for (const d of dirs) {
  try {
    rmSync(d, { recursive: true, force: true });
    console.log('Cleaned:', d);
  } catch (e) {
    console.log('Skip:', d);
  }
}

console.log('Done cleaning caches');
