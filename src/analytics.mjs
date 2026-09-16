import { inject } from '@vercel/analytics';

// Measure public pages only; never collect project-brief fields or URL parameters.
if (location.hostname === 'vianovamarketing.ca' && navigator.doNotTrack !== '1') {
  const allowedPaths = new Set(['/', '/index.html', '/services.html', '/about.html', '/work.html', '/contact.html', '/privacy.html']);
  inject({ mode: 'production', beforeSend(event) {
    const url = new URL(event.url);
    if (!allowedPaths.has(url.pathname)) return null;
    url.search = '';
    url.hash = '';
    return { ...event, url: url.toString() };
  } });
}
