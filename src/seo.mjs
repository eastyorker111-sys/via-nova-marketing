export const origin = 'https://vianovamarketing.ca';
export const pageUrl = key => `${origin}/${key === 'index' ? '' : `${key}.html`}`;
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
export function searchMetadata(key, page) {
  const business = {
    '@type': 'Organization', '@id': `${origin}/#organization`, name: 'Via Nova Marketing',
    url: `${origin}/`, logo: `${origin}/assets/logo-adobe.png`,
    telephone: '+14372376895', email: 'east_yorker@outlook.com',
    parentOrganization: { '@type': 'Organization', name: 'EAST YORKER CORP.' },
    address: { '@type': 'PostalAddress', streetAddress: '75 Thorncliffe Park Drive',
      addressLocality: 'Toronto', addressRegion: 'ON', postalCode: 'M4H 1L4', addressCountry: 'CA' }
  };
  const graph = [business, { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'Via Nova Marketing', publisher: { '@id': business['@id'] } },
    { '@type': key === 'contact' ? 'ContactPage' : key === 'about' ? 'AboutPage' : 'WebPage', '@id': pageUrl(key), url: pageUrl(key), name: page.title, description: page.description, isPartOf: { '@id': `${origin}/#website` } }];
  return `<meta property="og:url" content="${pageUrl(key)}"><meta property="og:site_name" content="Via Nova Marketing"><meta property="og:locale" content="en_CA"><meta property="og:image" content="${origin}/assets/hero-adobe.png"><meta property="og:image:alt" content="A mountain road rising toward a golden sunrise — A Higher Way Forward"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(page.title)} — Via Nova Marketing"><meta name="twitter:description" content="${escape(page.description)}"><meta name="twitter:image" content="${origin}/assets/hero-adobe.png"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`;
}
