(() => {
  const measurementId = 'G-LYCLD92MGB';
  const storageKey = 'via-nova-analytics-choice';
  const paths = new Set(['/', '/index.html', '/services.html', '/about.html', '/work.html', '/contact.html', '/quote.html', '/privacy.html']);
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
    // Only known business labels enter analytics. Unknown URL text is discarded.
    const labels={source:['linkedin','instagram','facebook','google_business_profile','whatsapp','newsletter'],medium:['organic_social','referral','email','cpc'],name:['2026_11_service_intro','planning_intro','website_enquiries','brand_clarity'],content:['profile_link','service_post','video','newsletter_link']};
    const params=new URL(location.origin+location.pathname+(location.search||'')).searchParams,campaign={};
    for(const [key,allowed]of Object.entries(labels)){const value=params.get(key==='name'?'utm_campaign':'utm_'+key);if(allowed.includes(value))campaign['campaign_'+key]=value;}
    gtag('config', measurementId, {
      ...campaign,
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
    settings.focus({preventScroll:true});
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
    if (href === 'quote.html' || href === '/quote.html') gtag('event', 'project_request_click', { entry_point: location.pathname });
  });
  const starts=new Set();
  document.addEventListener('input',event=>{
    if(!enabled)return;
    const form=event.target.closest('form');
    const kind=form?.id==='enquiry-form'?'quick':form?.id==='quote-form'?'brief':'';
    if(kind&&!starts.has(kind)){starts.add(kind);gtag('event','enquiry_start',{form_kind:kind});}
  });
  document.addEventListener('vnm:enquiry-saved',event=>{
    if(!enabled||!['quick','brief'].includes(event.detail?.kind))return;
    gtag('event','enquiry_submitted',{form_kind:event.detail.kind});
  });
})();
