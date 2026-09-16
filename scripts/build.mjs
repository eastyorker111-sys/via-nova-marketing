import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { pages, layout } from '../src/pages.mjs';
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
for (const [name, page] of Object.entries(pages)) await writeFile(`dist/${name}.html`, layout(name, page));
console.log(`Built ${Object.keys(pages).length} pages in dist/`);
