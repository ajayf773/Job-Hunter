// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

import { getStealthBrowser } from './_cloakbrowser.mjs';

const FEED_BASE = 'https://japan-dev.com/jobs';

/** @type {Provider} */
export default {
  id: 'japandev',
  detect(entry) {
    if (entry?.provider === 'japandev') return { url: FEED_BASE };
    if (typeof entry?.careers_url === 'string' && entry.careers_url.includes('japan-dev.com')) {
      return { url: entry.careers_url };
    }
    return null;
  },
  async fetch(entry, ctx) {
    const browser = await getStealthBrowser();
    const page = await browser.newPage();
    try {
      const targetUrl = entry?.careers_url || FEED_BASE;
      await page.goto(targetUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const jobs = await page.evaluate(() => {
        const results = [];
        const seen = new Set();
        const anchors = document.querySelectorAll('a[href*="/jobs/"]');

        anchors.forEach(a => {
          const href = a.href;
          if (!href || href.endsWith('/jobs') || seen.has(href)) return;

          const text = a.innerText.trim();
          if (!text) return;

          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          const title = lines[0];

          // Basic quality check for title
          if (title.length < 3 || title.toLowerCase().includes('browse all')) return;

          seen.add(href);
          results.push({
            title: title,
            url: href,
            company: lines.length > 1 ? lines[1] : 'Japan Dev',
            location: 'Japan'
          });
        });

        return results;
      });

      return jobs;
    } catch (err) {
      console.error(`[japandev] Scraping failed: ${err.message}`);
      return [];
    } finally {
      await page.close();
    }
  }
};
