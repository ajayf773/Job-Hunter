import { launch } from 'cloakbrowser';

async function testJapanDev() {
  console.log("🚀 Launching CloakBrowser for Japan Dev...");
  const browser = await launch({ humanize: true, headless: true });
  try {
    const page = await browser.newPage();
    console.log("🌐 Navigating to https://japandev.com/jobs ...");
    await page.goto('https://japandev.com/jobs', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const title = await page.title();
    console.log(`📌 Page Title: ${title}`);

    // Extract job links and titles
    const jobs = await page.evaluate(() => {
      const results = [];
      // Look for job links or card containers
      const anchors = document.querySelectorAll('a[href*="/jobs/"]');
      anchors.forEach(a => {
        const titleText = a.innerText.trim();
        const href = a.href;
        if (titleText && href && !href.endsWith('/jobs')) {
          results.push({ title: titleText.split('\n')[0], url: href });
        }
      });
      return results;
    });

    console.log(`✅ Found ${jobs.length} jobs on Japan Dev:`);
    console.log(jobs.slice(0, 5));

  } catch (err) {
    console.error("❌ Failed to fetch Japan Dev:", err);
  } finally {
    await browser.close();
  }
}

testJapanDev();
