import { launch } from 'cloakbrowser';

async function testTokyoDev() {
  console.log("🚀 Launching CloakBrowser for TokyoDev...");
  const browser = await launch({ humanize: true, headless: true });
  try {
    const page = await browser.newPage();
    console.log("🌐 Navigating to https://www.tokyodev.com/jobs ...");
    await page.goto('https://www.tokyodev.com/jobs', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log(`📌 Title: ${await page.title()}`);

    const jobs = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('a[href*="/jobs/"]');
      cards.forEach(a => {
        const href = a.href;
        const text = a.innerText.trim();
        if (text && href && !href.endsWith('/jobs')) {
          results.push({ title: text.split('\n')[0], url: href });
        }
      });
      return results;
    });

    console.log(`✅ Found ${jobs.length} jobs on TokyoDev:`);
    console.log(jobs.slice(0, 5));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

testTokyoDev();
