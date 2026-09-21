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
    assert.ok(html.includes('index, follow'));
    assert.ok(!html.includes('noindex'));
    assert.ok(html.includes('rel="canonical"'));
    for (const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https:|tel:|mailto:)/.test(href)) { assert.ok(new URL(href).pathname, href); }
      else if (href.startsWith('#')) assert.ok(html.includes(`id="${href.slice(1)}"`));
      else if (href.includes('.html')) {
        const [file, fragment] = href.split('#');
        const destination = pages[file.slice(0,-5)];
        assert.ok(destination, href);
        if (fragment) assert.ok(destination.content.includes(`id="${fragment}"`), href);
      }
      else assert.ok(existsSync(`public/${href}`) || (href === 'assets/analytics.js' && existsSync(`dist/${href}`)), href);
    }
  });
}
test('placeholders disclose limitations', () => {
  assert.match(pages.work.content, /No client projects or results/);
  assert.match(pages.contact.content, /action="https:\/\/formspree.io\/f\/xqpaqedp" method="POST"/);
  assert.match(pages.contact.content, /type="email" name="email"[^>]*required/);
  assert.match(pages.privacy.content, /Formspree processes and stores submissions/);
});

test('search metadata uses valid business data and each page URL', () => {
  for (const [key,page] of Object.entries(pages)) {
    const html=layout(key,page);
    const json=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(json['@graph'][0].telephone,'+14372376895');
    assert.equal(json['@graph'][0].address.postalCode,'M4H 1L4');
    assert.ok(html.includes('property="og:image"'));
    assert.equal(new Set(json['@graph'].map(x=>x['@id'])).size,3);
  }
});
