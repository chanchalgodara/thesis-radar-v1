import { rmSync, readdirSync } from 'fs';
import { join } from 'path';

// Delete stale Vite config cache
const cacheDir = join(process.cwd(), 'node_modules', '.vite-temp');
try {
  const files = readdirSync(cacheDir);
  for (const f of files) {
    const fp = join(cacheDir, f);
    rmSync(fp, { force: true });
    console.log('Deleted stale cache:', fp);
  }
} catch (e) {
  console.log('No .vite-temp cache found or already clean');
}

// Also delete .vite cache
const viteCache = join(process.cwd(), 'node_modules', '.vite');
try {
  rmSync(viteCache, { recursive: true, force: true });
  console.log('Deleted .vite cache');
} catch (e) {
  console.log('No .vite cache found');
}

console.log('Cache busted successfully');
