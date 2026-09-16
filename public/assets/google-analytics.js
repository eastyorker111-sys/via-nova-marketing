(() => {
  const measurementId = 'G-LYCLD92MGB';
  const storageKey = 'via-nova-analytics-choice';
  const paths = new Set(['/', '/index.html', '/services.html', '/about.html', '/work.html', '/contact.html', '/privacy.html']);
  const panel = document.querySelector('#analytics-choice');
  const settings = document.querySelector('#analytics-settings');
  if (!panel || !settings) return;
  const blocked = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const production = location.hostname === 'vianovamarketing.ca' && paths.has(location.pathname);
  let enabled = false;
  let started = false;
  let choice;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && saved.expires > Date.now()) choice = saved.value;
  } catch { /* Storage can be unavailable; default to no Google tracking. */ }
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  const deny = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  gtag('consent', 'default', deny);

  function start() {
    if (!production || blocked || started) return;
    started = enabled = true;
    window[`ga-disable-${measurementId}`] = false;
    gtag('consent', 'update', { ...deny, analytics_storage: 'granted' });
    gtag('js', new Date());
    let referrer = '';
    try { referrer = document.referrer ? new URL(document.referrer).origin : ''; } catch {}
    gtag('config', measurementId, {
      page_location: `${location.origin}${location.pathname}`,
      page_referrer: referrer,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 60 * 60 * 24 * 180
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  }

  function save(value) {
    try { localStorage.setItem(storageKey, JSON.stringify({ value, expires: Date.now() + 180 * 86400000 })); } catch {}
    panel.hidden = true;
    if (value === 'granted' && !blocked) {
      if (started && !enabled) location.reload();
      else start();
    } else {
      enabled = false;
      window[`ga-disable-${measurementId}`] = true;
      gtag('consent', 'update', deny);
      // Remove this site's GA cookies when the visitor withdraws consent.
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) continue;
        for (const domain of ['', `;domain=${location.hostname}`, `;domain=.${location.hostname}`]) {
          document.cookie = `${name}=;max-age=0;path=/${domain};SameSite=Lax`;
        }
      }
    }
    settings.focus();
  }
  panel.querySelector('[data-analytics="accept"]').addEventListener('click', () => save('granted'));
  panel.querySelector('[data-analytics="decline"]').addEventListener('click', () => save('denied'));
  settings.addEventListener('click', () => {
    panel.hidden = false;
    panel.querySelector('[data-analytics="decline"]').focus();
  });
  if (blocked) {
    panel.querySelector('#analytics-explanation').textContent = 'Your browser requests privacy protection. Google Analytics stays off. You can continue using every part of this website.';
    panel.querySelector('[data-analytics="accept"]').hidden = true;
  } else if (choice === 'granted') start();
  else if (choice !== 'denied') panel.hidden = false;

  // Count contact-button intent, not messages sent or completed enquiries.
  document.addEventListener('click', event => {
    if (!enabled) return;
    const link = event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const method = href.startsWith('tel:') ? 'phone' : href.startsWith('mailto:') ? 'email' : href.startsWith('https://wa.me/14372376895') ? 'whatsapp' : '';
    if (method) gtag('event', 'contact_click', { contact_method: method });
  });
})();
