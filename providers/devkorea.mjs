// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

import { getStealthBrowser } from './_cloakbrowser.mjs';

const FEED_BASE = 'https://dev-korea.com';

/** @type {Provider} */
export default {
  id: 'devkorea',
  detect(entry) {
    if (entry?.provider === 'devkorea') return { url: FEED_BASE };
    if (typeof entry?.careers_url === 'string' && entry.careers_url.includes('dev-korea.com')) {
      return { url: entry.careers_url };
    }
    return null;
  },
  async fetch(entry, ctx) {
    const browser = await getStealthBrowser();
    const page = await browser.newPage();
    try {
      const targetUrl = entry?.careers_url || FEED_BASE;
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const jobs = await page.evaluate(() => {
        const results = [];
        const seen = new Set();
        const anchors = document.querySelectorAll('a[href*="/jobs/"]');

        anchors.forEach(a => {
          const href = a.href;
          if (!href || seen.has(href)) return;

          const text = a.innerText.trim();
          if (!text || text.length < 3) return;

          const title = text.split('\n')[0].trim();
          seen.add(href);

          results.push({
            title: title,
            url: href,
            company: 'Dev Korea Target',
            location: 'South Korea (English Friendly)'
          });
        });

        return results;
      });

      return jobs;
    } catch (err) {
      console.error(`[devkorea] Scraping failed: ${err.message}`);
      return [];
    } finally {
      await page.close();
    }
  }
};
