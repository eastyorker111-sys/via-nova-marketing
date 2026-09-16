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
      else if (href.includes('.html')) {
        const [file, fragment] = href.split('#');
        const destination = pages[file.slice(0,-5)];
        assert.ok(destination, href);
        if (fragment) assert.ok(destination.content.includes(`id="${fragment}"`), href);
      }
      else assert.ok(existsSync(`public/${href}`), href);
    }
  });
}
test('placeholders disclose limitations', () => {
  assert.match(pages.work.content, /No client projects or results/);
  assert.match(pages.contact.content, /does not send or store/);
});
