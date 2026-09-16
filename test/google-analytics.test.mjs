import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../public/assets/google-analytics.js', import.meta.url), 'utf8');
function setup({ choice, dnt = '0', host = 'vianovamarketing.ca' } = {}) {
  const handlers = {};
  const element = key => ({ hidden: false, focus() {}, addEventListener: (_, fn) => handlers[key] = fn });
  const accept = element('accept'), decline = element('decline'), settings = element('settings');
  const panel = { hidden: true, querySelector: sel => sel.includes('accept') ? accept : sel.includes('decline') ? decline : {} };
  const scripts = [], events = {};
  const document = {
    referrer: 'https://example.com/path?private=value', cookie: '',
    querySelector: sel => sel === '#analytics-choice' ? panel : settings,
    createElement: () => ({}), head: { append: s => scripts.push(s) },
    addEventListener: (name, fn) => events[name] = fn
  };
  let stored = choice ? JSON.stringify({ value: choice, expires: Date.now() + 100000 }) : null;
  const window = {};
  runInNewContext(source, { document, window, navigator: { doNotTrack: dnt }, location: { hostname: host, origin: `https://${host}`, pathname: '/contact.html', search: '?secret=private', hash: '#secret', reload() {} }, localStorage: { getItem: () => stored, setItem: (_, value) => stored = value }, URL, Date, Set });
  return { scripts, handlers, panel, window, events, document };
}
test('Google tag is blocked until acceptance and when declined', () => {
  const first = setup();
  assert.equal(first.scripts.length, 0);
  assert.equal(first.panel.hidden, false);
  first.handlers.decline();
  assert.equal(first.scripts.length, 0);
  assert.equal(setup({ choice: 'denied' }).scripts.length, 0);
});
test('acceptance loads once, sends clean URL and only contact method', () => {
  const page = setup();
  page.handlers.accept(); page.handlers.accept();
  assert.equal(page.scripts.length, 1);
  const config = page.window.dataLayer.find(row => row[0] === 'config')[2];
  assert.equal(config.page_location, 'https://vianovamarketing.ca/contact.html');
  assert.equal(config.page_referrer, 'https://example.com');
  assert.equal(config.allow_google_signals, false);
  page.events.click({ target: { closest: () => ({ getAttribute: () => 'mailto:east_yorker@outlook.com' }) } });
  const event = page.window.dataLayer.at(-1);
  assert.equal(event[1], 'contact_click');
  assert.deepEqual(Object.keys(event[2]), ['contact_method']);
  page.handlers.decline();
  const count = page.window.dataLayer.length;
  page.events.click({ target: { closest: () => ({ getAttribute: () => 'tel:+14372376895' }) } });
  assert.equal(page.window.dataLayer.length, count);
  assert.equal(page.window['ga-disable-G-LYCLD92MGB'], true);
});
test('privacy signal and nonproduction pages never load Google', () => {
  assert.equal(setup({ choice: 'granted', dnt: '1' }).scripts.length, 0);
  assert.equal(setup({ choice: 'granted', host: 'localhost' }).scripts.length, 0);
});
