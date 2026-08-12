import { launch } from 'cloakbrowser';

let browserInstance = null;

/**
 * Get or launch the shared CloakBrowser stealth Chromium instance.
 */
export async function getStealthBrowser() {
  if (!browserInstance) {
    browserInstance = await launch({
      humanize: true,
      headless: true
    });
  }
  return browserInstance;
}

/**
 * Close the shared stealth browser instance if active.
 */
export async function closeStealthBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch {
      // ignore cleanup errors
    }
    browserInstance = null;
  }
}
