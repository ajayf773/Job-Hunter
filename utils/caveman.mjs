import * as cheerio from 'cheerio';

const stopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
  'to', 'in', 'on', 'with', 'by', 'for', 'of', 'that', 'this', 'it',
  'its', 'as', 'at', 'be', 'from', 'which', 'has', 'have', 'had', 'been',
  'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must',
  'do', 'does', 'did', 'done', 'doing', 'i', 'you', 'he', 'she', 'we', 'they'
]);

/**
 * Caveman compression: 
 * Strips out fluff words and collapses whitespace to dramatically save LLM tokens.
 */
export function cavemanCompressText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // 1. Collapse horizontal whitespace, preserve newlines
  let compressed = text.replace(/[ \t]+/g, ' ');
  
  // 2. Remove non-essential punctuation (keep periods, commas, colons, hyphens, numbers)
  // This helps keep list structures and sentences intact while stripping quotes and brackets.
  compressed = compressed.replace(/[";'()\[\]]/g, '');
  
  // 3. Drop stop words (handling leading and trailing punctuation)
  compressed = compressed.split(' ')
    .filter(word => !stopwords.has(word.toLowerCase().replace(/^[.,:;?!]+|[.,:;?!]+$/g, '')))
    .join(' ');
    
  return compressed.trim();
}

/**
 * Safe compression for system prompts and rules.
 * Collapses whitespace but preserves stop words to maintain grammatical instruction following.
 */
export function cavemanCompressPrompt(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[ \t]+/g, ' ').trim();
}

/**
 * Strips DOM junk (navs, scripts, styles) and returns clean, caveman-compressed text.
 */
export function cavemanCompressHtml(html) {
  if (!html || typeof html !== 'string') return '';
  
  const $ = cheerio.load(html);
  
  // Remove non-semantic bloat
  $('nav, header, footer, script, style, iframe, svg, aside, noscript, meta, link, .ad, .sidebar, .menu, .footer').remove();
  
  // Extract pure text
  const plainText = $('body').text();
  
  // Pass to text compressor
  return cavemanCompressText(plainText);
}
