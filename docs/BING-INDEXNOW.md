# Bing and IndexNow

IndexNow is notified after a successful Production deployment reported by Vercel to GitHub. Preview deployments do not trigger submissions. The workflow reads the canonical production sitemap, checks that the ownership file is live, and verifies that the pages return public HTML before notifying participating search engines.

Page fingerprints are cached between runs to avoid resubmitting unchanged content. A new or evicted cache starts with the current sitemap. Removed URLs are submitted only after a live redirect, 404, or 410 is confirmed. No website credentials or enquiry data are sent.

Run `node scripts/indexnow.mjs` for a read-only check, or add `--submit` to notify IndexNow after a release. The same workflow can be run manually from GitHub Actions. Do not submit preview URLs or private pages. Keep `public/<key>.txt` deployed; this is an ownership-verification file, not an account password.

HTTP 200 means the URLs were accepted. HTTP 202 means key validation is pending. Neither guarantees indexing or ranking. Bing's dashboard and recommendations can take time to update. Backlink recommendations require real links from relevant, reputable sources and cannot be fixed by this integration.

Sources: https://www.indexnow.org/documentation and https://www.bing.com/indexnow/getstarted
