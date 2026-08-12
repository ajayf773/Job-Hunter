import { launch } from 'cloakbrowser';

async function testRelocateMe() {
  console.log("🚀 Launching CloakBrowser for Relocate.me...");
  const browser = await launch({ humanize: true, headless: true });
  try {
    const page = await browser.newPage();
    console.log("🌐 Navigating to https://relocate.me/search ...");
    await page.goto('https://relocate.me/search', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log(`📌 Title: ${await page.title()}`);

    const jobs = await page.evaluate(() => {
      const results = [];
      const links = document.querySelectorAll('a[href*="/jobs/"]');
      links.forEach(a => {
        const title = a.innerText.trim();
        const url = a.href;
        if (title && url && title.length > 3) {
          results.push({ title: title.split('\n')[0], url });
        }
      });
      return results;
    });

    console.log(`✅ Found ${jobs.length} relocation jobs:`);
    console.log(jobs.slice(0, 5));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

testRelocateMe();
