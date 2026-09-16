import { build } from 'esbuild';
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { pageUrl } from '../src/seo.mjs';
import { pages, layout } from '../src/pages.mjs';
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
for (const [name, page] of Object.entries(pages)) await writeFile(`dist/${name}.html`, layout(name, page));
console.log(`Built ${Object.keys(pages).length} pages in dist/`);

await writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + Object.keys(pages).map(key => '  <url><loc>' + pageUrl(key) + '</loc></url>').join('\n') + '\n</urlset>\n');
await writeFile('dist/404.html', layout('404', { title: 'Page not found', description: 'This page could not be found.', content: '<section class="page-intro container"><p class="eyebrow">404</p><h1>A different path.</h1><p>This page could not be found.</p><p><a class="button" href="/">Return to the homepage</a></p></section>' }).replace('content="index, follow"', 'content="noindex, follow"'));

await build({entryPoints:['src/analytics.mjs'], bundle:true, minify:true, platform:'browser', outfile:'dist/assets/analytics.js'});
