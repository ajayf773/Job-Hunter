import { launch } from 'cloakbrowser';

async function testITViecAI() {
  const browser = await launch({ humanize: true, headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('https://itviec.com/it-jobs/ai', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log(`📌 Page Title: ${await page.title()}`);

    const jobs = await page.evaluate(() => {
      const results = [];
      const anchors = document.querySelectorAll('h3 a, .job_content a, a[data-job-id]');
      anchors.forEach(a => {
        const href = a.href;
        const text = a.innerText.trim();
        if (text && href) {
          results.push({ title: text, url: href });
        }
      });
      return results;
    });

    console.log(`✅ Found ${jobs.length} AI jobs on ITviec:`);
    console.log(jobs.slice(0, 5));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

testITViecAI();
