import { launch } from 'cloakbrowser';
import fs from 'fs';

async function runStealthTest() {
  console.log("🚀 Launching CloakBrowser...");
  
  // Launch with humanize true to spoof Canvas, WebGL, Audio, and inject stealth scripts
  const browser = await launch({ 
    humanize: true,
    headless: true // Keep headless for CLI running, cloakbrowser patches headless detection
  });

  try {
    const page = await browser.newPage();
    
    // We'll test against sannysoft, a standard bot detection test page
    const targetUrl = 'https://bot.sannysoft.com/';
    console.log(`🌐 Navigating to ${targetUrl}...`);
    
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    
    // Wait a moment for any JS challenges to resolve
    await page.waitForTimeout(3000);
    
    // Take a screenshot to verify visual bypass
    await page.screenshot({ path: 'stealth-test-result.png', fullPage: true });
    console.log("📸 Saved screenshot to stealth-test-result.png");
    
    // Extract the bot detection results
    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      const data = {};
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 2) {
          data[cells[0].innerText.trim()] = cells[1].innerText.trim();
        }
      });
      return data;
    });

    console.log("✅ Bot Detection Results:");
    console.log(`WebDriver (should be missing): ${results['WebDriver']}`);
    console.log(`HeadlessChrome (should be missing): ${results['Chrome (headless)']}`);
    
    fs.writeFileSync('stealth-test-results.json', JSON.stringify(results, null, 2));
    console.log("📄 Saved full results to stealth-test-results.json");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await browser.close();
    console.log("🛑 Browser closed.");
  }
}

runStealthTest();
