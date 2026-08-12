import { launch } from 'cloakbrowser';

async function testGermanTechJobsDebug() {
  const browser = await launch({ humanize: true, headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('https://germantechjobs.de/jobs/all/tech', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log(`📌 Final URL: ${page.url()}`);
    console.log(`📌 Page Title: ${await page.title()}`);

    const jobLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors
        .map(a => ({ text: a.innerText.trim(), href: a.href }))
        .filter(a => a.href.includes('/jobs/') && a.text.length > 5);
    });

    console.log(`✅ Found ${jobLinks.length} job links:`);
    console.log(jobLinks.slice(0, 5));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

testGermanTechJobsDebug();
