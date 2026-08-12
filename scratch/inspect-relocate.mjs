import { launch } from 'cloakbrowser';

async function inspectRelocate() {
  const browser = await launch({ humanize: true, headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('https://relocate.me/search', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const jobCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.job-card, .jobs-list__item, article, [class*="job"]'));
      return cards.map(c => {
        const titleEl = c.querySelector('a, h2, h3, [class*="title"]');
        return {
          text: titleEl ? titleEl.innerText.trim() : c.innerText.trim().slice(0, 50),
          href: titleEl ? titleEl.getAttribute('href') : null
        };
      }).filter(x => x.text && x.href);
    });

    console.log(`Card count: ${jobCards.length}`);
    console.log(jobCards.slice(0, 5));
  } finally {
    await browser.close();
  }
}
inspectRelocate();
