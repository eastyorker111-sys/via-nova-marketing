import sharp from 'sharp';
import { stat } from 'node:fs/promises';

// Delivery copies only: approved PNG masters remain untouched.
for (const [name, widths, quality] of [
  ['hero-adobe', [640, 960, 1536], 84],
  ['logo-adobe', [320, 640, 960], 92],
]) {
  for (const width of widths) {
    const output = `public/assets/${name}-${width}.webp`;
    await sharp(`public/assets/${name}.png`).resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 6 }).toFile(output);
    console.log(`${output}: ${(await stat(output)).size} bytes`);
  }
}
