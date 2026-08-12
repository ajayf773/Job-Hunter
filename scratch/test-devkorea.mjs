import { launch } from 'cloakbrowser';

async function testDevKorea() {
  console.log("🚀 Launching CloakBrowser for Dev Korea...");
  const browser = await launch({ humanize: true, headless: true });
  try {
    const page = await browser.newPage();
    console.log("🌐 Navigating to https://dev-korea.com ...");
    await page.goto('https://dev-korea.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log(`📌 Title: ${await page.title()}`);

    const jobs = await page.evaluate(() => {
      const results = [];
      const links = document.querySelectorAll('a[href*="/job/"], a[href*="/jobs/"]');
      links.forEach(a => {
        const text = a.innerText.trim();
        const href = a.href;
        if (text && href && text.length > 3) {
          results.push({ title: text.split('\n')[0], url: href });
        }
      });
      return results;
    });

    console.log(`✅ Found ${jobs.length} jobs on Dev Korea:`);
    console.log(jobs.slice(0, 5));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

testDevKorea();
