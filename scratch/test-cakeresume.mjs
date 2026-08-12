import { launch } from 'cloakbrowser';

async function testCakeResume() {
  console.log("🚀 Launching CloakBrowser for CakeResume...");
  const browser = await launch({ humanize: true, headless: true });
  try {
    const page = await browser.newPage();
    console.log("🌐 Navigating to https://www.cakeresume.com/jobs ...");
    await page.goto('https://www.cakeresume.com/jobs', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log(`📌 Page Title: ${await page.title()}`);

    const jobs = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('a[href*="/jobs/"], a[href*="/companies/"]');
      cards.forEach(a => {
        const href = a.href;
        const text = a.innerText.trim();
        if (text && href && href.includes('/jobs/') && text.length > 3) {
          results.push({ title: text.split('\n')[0], url: href });
        }
      });
      return results;
    });

    console.log(`✅ Found ${jobs.length} jobs on CakeResume:`);
    console.log(jobs.slice(0, 5));

  } catch (err) {
    console.error("❌ Failed to fetch CakeResume:", err);
  } finally {
    await browser.close();
  }
}

testCakeResume();
