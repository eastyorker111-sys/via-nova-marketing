import {readFileSync} from 'node:fs';
import {analyticsChoice} from './analytics-choice.mjs';
import {searchMetadata} from './seo.mjs';
const content=readFileSync(new URL('./polished-home.html',import.meta.url),'utf8');
export function cinematicHome(page){return content.replace('</head>',`<link rel="canonical" href="https://vianovamarketing.ca/"><meta property="og:title" content="Via Nova Marketing — Branding, websites and content">${searchMetadata('index',page)}<link rel="icon" href="assets/monogram-adobe.png"><script src="assets/google-analytics.js" defer></script></head>`).replace('</body>',analyticsChoice+'</body>');}
