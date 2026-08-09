#!/usr/bin/env node

/**
 * reset-and-reevaluate.mjs
 * 
 * Performs a complete fresh wipe & re-evaluation from scratch:
 * 1. Clears old reports in reports/ & resets batch/auto-eval-done.txt
 * 2. Re-evaluates top 100 job URLs using the updated Visa Sponsorship, Work Permit, & Language rules
 *    via 3-Key Gemini API Load Balancer (gemini-eval.mjs)
 * 3. Builds a brand new output/Top_Jobs_Analysis.xlsx and output/Top_Jobs_Analysis.csv
 * 
 * Usage:
 *   node batch/reset-and-reevaluate.mjs [--limit=100]
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = join(ROOT, 'reports');
const doneFilePath = join(ROOT, 'batch', 'auto-eval-done.txt');
const scanHistoryPath = join(ROOT, 'data', 'scan-history.tsv');

const limitArg = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 100;

console.log(`💥 FRESH RESET & RE-EVALUATION FROM SCRATCH`);
console.log(`==================================================`);
console.log(`🎯 Target: Re-evaluate first ${LIMIT} jobs with updated rules via Gemini API Load Balancer.`);
console.log(`==================================================\n`);

// 1. Reset done tracker
if (existsSync(doneFilePath)) {
  writeFileSync(doneFilePath, '', 'utf8');
  console.log(`✅ Cleared batch/auto-eval-done.txt`);
}

// 2. Clear old evaluation reports
if (existsSync(reportsDir)) {
  const oldReports = readdirSync(reportsDir).filter(f => f.endsWith('.md'));
  console.log(`🗑️ Deleting ${oldReports.length} old evaluation reports from reports/...`);
  oldReports.forEach(f => {
    try { unlinkSync(join(reportsDir, f)); } catch {}
  });
  console.log(`✅ Reports directory cleared.`);
}

// 3. Reset applications.md header
const trackerPath = join(ROOT, 'data', 'applications.md');
const freshHeader = `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
`;
writeFileSync(trackerPath, freshHeader, 'utf8');
console.log(`✅ Reset data/applications.md tracker.`);

// 4. Extract URLs from scan-history.tsv
if (!existsSync(scanHistoryPath)) {
  console.error(`❌ scan-history.tsv not found.`);
  process.exit(1);
}

const scanHistoryText = readFileSync(scanHistoryPath, 'utf8');
const lines = scanHistoryText.split('\n').filter(l => l.trim());
const urls = [];

for (let i = lines.length - 1; i >= 0 && urls.length < LIMIT; i--) {
  const parts = lines[i].split('\t');
  const url = parts.find(p => p.startsWith('http://') || p.startsWith('https://'));
  if (url && !urls.includes(url)) {
    urls.push(url);
  }
}

console.log(`\n📋 Found ${urls.length} unique job URLs to re-evaluate from scratch.`);
console.log(`🤖 Starting Gemini API Load-Balanced Evaluations...\n`);

let successCount = 0;
for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  console.log(`[${i + 1}/${urls.length}] Evaluating: ${url}`);
  try {
    execSync(`node gemini-eval.mjs "${url}"`, { cwd: ROOT, stdio: 'inherit' });
    successCount++;
  } catch (err) {
    console.error(`⚠️ Evaluation failed for ${url}: ${err.message}`);
  }
}

console.log(`\n🎉 Completed ${successCount}/${urls.length} evaluations!`);

// 5. Generate fresh Excel .xlsx and .csv files
console.log(`\n📊 Generating brand new output/Top_Jobs_Analysis.xlsx...`);
try {
  execSync(`node batch/generate-excel-xlsx.mjs`, { cwd: ROOT, stdio: 'inherit' });
} catch (err) {
  console.error(`⚠️ Excel generation error: ${err.message}`);
}

console.log(`\n==================================================`);
console.log(`🎉 FRESH RE-EVALUATION COMPLETE!`);
console.log(`  - Top Jobs Excel: output/Top_Jobs_Analysis.xlsx`);
console.log(`  - Top Jobs CSV:   output/Top_Jobs_Analysis.csv`);
console.log(`==================================================`);
