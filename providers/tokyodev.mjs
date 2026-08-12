// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

import { getStealthBrowser } from './_cloakbrowser.mjs';

const FEED_BASE = 'https://www.tokyodev.com/jobs';

/** @type {Provider} */
export default {
  id: 'tokyodev',
  detect(entry) {
    if (entry?.provider === 'tokyodev') return { url: FEED_BASE };
    if (typeof entry?.careers_url === 'string' && entry.careers_url.includes('tokyodev.com')) {
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
        const anchors = document.querySelectorAll('a[href*="/companies/"][href*="/jobs/"]');

        anchors.forEach(a => {
          const href = a.href;
          if (!href || seen.has(href)) return;

          const text = a.innerText.trim();
          if (!text) return;

          const title = text.split('\n')[0].trim();
          if (title.length < 3) return;

          seen.add(href);
          results.push({
            title: title,
            url: href,
            company: 'TokyoDev Target',
            location: 'Tokyo, Japan (English Friendly)'
          });
        });

        return results;
      });

      return jobs;
    } catch (err) {
      console.error(`[tokyodev] Scraping failed: ${err.message}`);
      return [];
    } finally {
      await page.close();
    }
  }
};
