export const origin = 'https://vianovamarketing.ca';
export const pageUrl = key => `${origin}/${key === 'index' ? '' : `${key}.html`}`;
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
export function searchMetadata(key, page) {
  const business = {
    '@type': 'Organization', '@id': `${origin}/#organization`, name: 'Via Nova Marketing',
    url: `${origin}/`, logo: `${origin}/assets/logo-enhanced-v1.png`,
    telephone: '+14372376895', email: 'vianovamarketing@outlook.com',
    areaServed: { '@type': 'Country', name: 'Canada' },
    sameAs: ['https://www.instagram.com/vianovamarketing.ca/', 'https://www.linkedin.com/company/vianovamarketing/', 'https://www.facebook.com/profile.php?id=61594206973632', 'https://www.google.com/maps?cid=17214167422504729291'],
    parentOrganization: { '@type': 'Organization', name: 'EAST YORKER CORP.' },
    address: { '@type': 'PostalAddress', streetAddress: '75 Thorncliffe Park Drive',
      addressLocality: 'Toronto', addressRegion: 'ON', postalCode: 'M4H 1L4', addressCountry: 'CA' }
  };
  const graph = [business, { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'Via Nova Marketing', publisher: { '@id': business['@id'] } },
    { '@type': key === 'contact' ? 'ContactPage' : key === 'about' ? 'AboutPage' : 'WebPage', '@id': pageUrl(key), url: pageUrl(key), name: page.title, description: page.description, inLanguage: 'en-CA', about: { '@id': business['@id'] }, isPartOf: { '@id': `${origin}/#website` } }];
  if(key==='services')graph.push(...['Business & marketing planning','Branding, logos & materials','Websites & online stores','Content, video & social media'].map((name,i)=>({'@type':'Service','@id':`${origin}/services.html#service-${i+1}`,name,url:`${origin}/services.html#service-${i+1}`,provider:{'@id':business['@id']},areaServed:{'@type':'Country',name:'Canada'}})));
  return `<meta property="og:url" content="${pageUrl(key)}"><meta property="og:site_name" content="Via Nova Marketing"><meta property="og:locale" content="en_CA"><meta property="og:image" content="${origin}/assets/via-nova-adobe-social.webp"><meta property="og:image:alt" content="Via Nova Marketing — Your business could be next"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(page.title)} — Via Nova Marketing"><meta name="twitter:description" content="${escape(page.description)}"><meta name="twitter:image" content="${origin}/assets/via-nova-adobe-social.webp"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`;
}
