import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

export function sitemapUrls(xml, origin) {
  const entries = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(match => match[1].trim().replaceAll('&amp;', '&'));
  if (!entries.length || entries.length > 10000) throw new Error('Expected a sitemap containing 1–10,000 URLs.');
  return [...new Set(entries.map(value => {
    const url = new URL(value);
    if (url.origin !== origin || url.username || url.password || url.search || url.hash) {
      throw new Error('Sitemap contains a URL outside the canonical production site.');
    }
    return url.href;
  }))];
}

export function changedUrls(previous, current) {
  return Object.keys(current).filter(url => previous[url] !== current[url]);
}

async function getText(url) {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Production check failed (${response.status}): ${url}`);
  return response.text();
}

async function main() {
  const submit = process.argv.includes('--submit');
  const config = JSON.parse(await readFile('indexnow.config.json', 'utf8'));
  const origin = new URL(config.origin).origin;
  if (!origin.startsWith('https://') || !/^[a-f0-9]{32}\.txt$/.test(config.keyFile)) throw new Error('Invalid production configuration.');
  const key = (await readFile(`public/${config.keyFile}`, 'utf8')).trim();
  if (`${key}.txt` !== config.keyFile) throw new Error('Local IndexNow key does not match its filename.');
  const keyLocation = `${origin}/${config.keyFile}`;
  if ((await getText(keyLocation)).trim() !== key) throw new Error('IndexNow key is not published on production yet.');
  const urls = sitemapUrls(await getText(`${origin}/sitemap.xml`), origin);
  const statePath = '.indexnow/state.json';
  let previous = { origin, hashes: {} };
  try {
    previous = JSON.parse(await readFile(statePath, 'utf8'));
    if (previous.origin !== origin || !previous.hashes) throw new Error('Saved state belongs to another site.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const hashes = {};
  for (const url of urls) {
    const html = await getText(url);
    if (!/<html[\s>]/i.test(html) || /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
      throw new Error(`Expected a public, indexable HTML page: ${url}`);
    }
    // Ignore script payloads that can change on every build without changing page content.
    const content = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    hashes[url] = createHash('sha256').update(content).digest('hex');
  }
  const urlList = changedUrls(previous.hashes, hashes);
  for (const url of Object.keys(previous.hashes).filter(url => !(url in hashes))) {
    if (new URL(url).origin !== origin) throw new Error('Saved state contains an unrelated domain.');
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
    if ([301, 302, 307, 308, 404, 410].includes(response.status)) urlList.push(url);
    else if (response.status !== 200) throw new Error(`Could not verify removed page: ${url}`);
  }
  console.log(`Checked ${urls.length} production pages; ${urlList.length} URLs need notification.`);
  if (!submit) {
    console.log('Dry run only. Use --submit after production verification.');
    return;
  }
  if (urlList.length) {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(origin).host, key, keyLocation, urlList }),
      signal: AbortSignal.timeout(30000), redirect: 'error'
    });
    if (![200, 202].includes(response.status)) throw new Error(`IndexNow rejected the request: HTTP ${response.status}.`);
    console.log(`IndexNow HTTP ${response.status}: ${response.status === 202 ? 'received; key validation pending' : 'submission accepted'}. Indexing is not guaranteed.`);
  }
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify({ origin, hashes }, null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
