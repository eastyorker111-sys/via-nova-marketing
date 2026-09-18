import test from 'node:test';
import assert from 'node:assert/strict';
import { sitemapUrls, changedUrls } from '../scripts/indexnow.mjs';

test('accepts only canonical sitemap URLs and removes duplicates', () => {
  assert.deepEqual(sitemapUrls('<loc>https://example.com/</loc><loc>https://example.com/</loc>', 'https://example.com'), ['https://example.com/']);
  for (const url of ['https://other.com/', 'https://example.com/?token=private', 'https://user:pass@example.com/', 'http://example.com/']) {
    assert.throws(() => sitemapUrls(`<loc>${url}</loc>`, 'https://example.com'));
  }
  assert.throws(() => sitemapUrls('<urlset/>', 'https://example.com'));
});

test('notifies only new or changed content', () => {
  assert.deepEqual(changedUrls({ '/same': 'a', '/changed': 'b' }, { '/same': 'a', '/changed': 'c', '/new': 'd' }), ['/changed', '/new']);
  assert.deepEqual(changedUrls({ '/same': 'a' }, { '/same': 'a' }), []);
});
