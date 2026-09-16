import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { pages, layout } from '../src/pages.mjs';
for (const [key, page] of Object.entries(pages)) {
  test(`${key}: landmark, single heading, valid internal destinations`, () => {
    const html = layout(key, page);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.ok(html.includes('<main id="main">'));
    assert.ok(html.includes('name="viewport"'));
    assert.ok(html.includes('noindex, nofollow'));
    for (const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (href.startsWith('#')) assert.ok(html.includes(`id="${href.slice(1)}"`));
      else if (href.endsWith('.html')) assert.ok(pages[href.slice(0,-5)], href);
      else assert.ok(existsSync(`public/${href}`), href);
    }
  });
}
test('placeholders disclose limitations', () => {
  assert.match(pages.work.content, /not client projects/);
  assert.match(pages.contact.content, /does not send or store/);
});
