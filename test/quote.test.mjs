import test from 'node:test';
import assert from 'node:assert/strict';
import { includesService, briefEntries, briefSummary } from '../public/assets/quote-model.js';
import { pages, layout } from '../src/pages.mjs';
test('full journey includes all service questions; individual selections stay focused', () => {
  for (const service of ['Strategy','Brand','Website','Materials','Content','Campaigns']) assert.equal(includesService(['Full journey'], service), true);
  assert.equal(includesService(['Website','Brand'], 'Content'), false);
  assert.equal(includesService(['Website','Brand'], 'Brand'), true);
  assert.equal(includesService(['Guidance'], 'Website'), false);
});
test('email brief groups multiple services, preserves text and excludes provider fields', () => {
  const entries = [['Services','Brand'],['Services','Website'],['Goals','<script>plain text</script>'],['_gotcha','spam'],['message','old summary'],['Optional',' ']];
  assert.deepEqual(briefEntries(entries), [['Services','Brand, Website'],['Goals','<script>plain text</script>']]);
  assert.equal(briefSummary(entries), 'Services:\nBrand, Website\n\nGoals:\n<script>plain text</script>');
});
test('guided brief stays discoverable and has a native submission fallback', () => {
  for (const [key, page] of Object.entries(pages)) assert.match(layout(key,page), /class="button nav-cta" href="quote.html"/);
  assert.match(pages.index.content, /Build your project/);
  assert.match(pages.contact.content, /href="quote.html"/);
  assert.match(pages.quote.content, /action="https:\/\/formspree.io\/f\/xqpaqedp" method="POST"/);
  assert.match(pages.quote.content, /name="Goals and audience" required/);
  assert.equal((pages.quote.content.match(/<fieldset data-step>/g)||[]).length,6);
});
