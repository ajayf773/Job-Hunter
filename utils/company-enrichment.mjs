import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { cavemanCompressText } from './caveman.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(__dirname, '..', 'data', 'company-cache.json');
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function loadCache() {
  if (!existsSync(CACHE_FILE)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function saveCache(cache) {
  const dir = dirname(CACHE_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Evict old entries to keep file small (max 200 companies)
  const keys = Object.keys(cache);
  if (keys.length > 200) {
    const sorted = keys.sort((a, b) => cache[b].timestamp - cache[a].timestamp);
    const newCache = {};
    for (let i = 0; i < 200; i++) {
      newCache[sorted[i]] = cache[sorted[i]];
    }
    cache = newCache;
  }

  // Atomic write: write to temp file first, then rename (prevents corruption on concurrent runs)
  const tempFile = `${CACHE_FILE}.${Date.now()}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  writeFileSync(tempFile, JSON.stringify(cache, null, 2), 'utf-8');
  renameSync(tempFile, CACHE_FILE);
}

/**
 * Fetches company enrichment data, checking the LRU cache first.
 */
export async function getEnrichedCompanyData(companyName) {
  if (!companyName || typeof companyName !== 'string' || companyName.toLowerCase() === 'unknown') {
    return null;
  }

  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const cache = loadCache();
  const now = Date.now();

  // 1. Check Cache
  if (cache[slug]) {
    const entry = cache[slug];
    if (now - entry.timestamp < CACHE_TTL_MS) {
      console.log(`⚡  [Caveman Cache Hit] Loaded enrichment data for: ${companyName}`);
      return entry.data;
    }
  }

  console.log(`🌐  [Caveman Cache Miss] Fetching external OSINT data for: ${companyName}...`);
  
  // 2. Fetch Data (Wikipedia API - handles redirects, case insensitivity, limits response size)
  let rawText = '';
  try {
    const encodedName = encodeURIComponent(companyName);
    // Use Wikipedia Action API with exchars limit to avoid fetching massive articles
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    let res;
    try {
      res = await fetch(
        `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts|pageprops&exintro&explaintext&exchars=3000&redirects=1&titles=${encodedName}`,
        {
          headers: {
            'User-Agent': 'job-hunter-ai/1.0 (https://github.com/santifer/job-hunter-ai) bot'
          },
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }
    
    if (res && res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        // Skip disambiguation pages — they contain useless "may refer to:" lists
        if (pageId === '-1' || page?.pageprops?.disambiguation !== undefined) {
          rawText = '';
        } else if (page?.extract) {
          // Check for disambiguation-like content even without the pageprops flag
          if (page.extract.includes('may refer to:') || page.extract.includes('may also refer to:')) {
            rawText = '';
          } else {
            rawText = page.extract;
          }
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`⚠️ Wikipedia fetch timed out for ${companyName}`);
    } else {
      console.warn(`⚠️ Failed to fetch enrichment data for ${companyName}:`, error.message);
    }
  }

  // Fallback string if not found
  if (!rawText) {
    rawText = `No Wikipedia data found for ${companyName}.`;
  }

  // 3. Compress (rawText is already limited to ~3000 chars by exchars param)
  const compressedText = cavemanCompressText(rawText).substring(0, 5000);

  // 4. Save to Cache (atomic write, separated from fetch to avoid losing data)
  try {
    cache[slug] = {
      timestamp: now,
      data: compressedText
    };
    saveCache(cache);
  } catch (e) {
    console.warn(`⚠️ Failed to write to company cache file: ${e.message}`);
  }

  return compressedText;
}
