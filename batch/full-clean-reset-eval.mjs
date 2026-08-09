#!/usr/bin/env node

/**
 * full-clean-reset-eval.mjs
 * 
 * HIGH-THROUGHPUT PARALLEL MULTI-KEY MULTI-MODEL RE-EVALUATION ENGINE:
 * 1. Performs complete fresh wipe of old reports, resumes, cold emails, & tracker files.
 * 2. Runs 6 PARALLEL CONCURRENT WORKERS simultaneously using Promise.all / Worker Pool.
 * 3. Each worker calls generateContentBalanced across 3 API Keys & 5 Gemini Models in parallel.
 * 4. Automatic 429 failover: If Worker A hits a rate limit, it instantly switches to another Key/Model
 *    without blocking Worker B or Worker C!
 * 5. Exports brand new output/Top_Jobs_Analysis.xlsx Excel file!
 * 
 * Usage:
 *   node batch/full-clean-reset-eval.mjs [--concurrency=6]
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, rmSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = join(ROOT, 'reports');
const resumesDir = join(ROOT, 'output', 'tailored-resumes');
const coldEmailsDir = join(ROOT, 'output', 'cold-emails');
const readyEmailsDir = join(ROOT, 'output', 'ready-to-send-emails');
const doneFilePath = join(ROOT, 'batch', 'auto-eval-done.txt');
const scanHistoryPath = join(ROOT, 'data', 'scan-history.tsv');
const pipelinePath = join(ROOT, 'data', 'pipeline.md');

const concurrencyArg = process.argv.find(a => a.startsWith('--concurrency='));
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 6;

console.log(`💥 PARALLEL MULTI-KEY MULTI-MODEL RE-EVALUATION ENGINE`);
console.log(`====================================================================`);
console.log(`⚡ Running ${CONCURRENCY} PARALLEL WORKERS SIMULTANEOUSLY across 3 API Keys & 5 Gemini Models!`);
console.log(`🎯 Wiping old reports, resumes, cold emails, & tracker files...`);
console.log(`====================================================================\n`);

// 1. Wipe old reports
if (existsSync(reportsDir)) {
  const oldReports = readdirSync(reportsDir).filter(f => f.endsWith('.md'));
  console.log(`🗑️ Deleting ${oldReports.length} old reports from reports/...`);
  oldReports.forEach(f => { try { unlinkSync(join(reportsDir, f)); } catch {} });
}

// 2. Wipe old tailored resumes
if (existsSync(resumesDir)) {
  const oldPdfs = readdirSync(resumesDir).filter(f => f.endsWith('.pdf'));
  console.log(`🗑️ Deleting ${oldPdfs.length} old PDF resumes from output/tailored-resumes/...`);
  oldPdfs.forEach(f => { try { unlinkSync(join(resumesDir, f)); } catch {} });
} else {
  mkdirSync(resumesDir, { recursive: true });
}

// 3. Wipe old cold emails
if (existsSync(coldEmailsDir)) {
  rmSync(coldEmailsDir, { recursive: true, force: true });
  mkdirSync(coldEmailsDir, { recursive: true });
  console.log(`🗑️ Cleared output/cold-emails/`);
}

if (existsSync(readyEmailsDir)) {
  rmSync(readyEmailsDir, { recursive: true, force: true });
  mkdirSync(readyEmailsDir, { recursive: true });
  console.log(`🗑️ Cleared output/ready-to-send-emails/`);
}

// 4. Reset tracker files
writeFileSync(doneFilePath, '', 'utf8');
const freshHeader = `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
`;
writeFileSync(join(ROOT, 'data', 'applications.md'), freshHeader, 'utf8');
console.log(`✅ Reset data/applications.md & batch/auto-eval-done.txt`);

// 5. Gather ALL unique job URLs
const urlsSet = new Set();

if (existsSync(scanHistoryPath)) {
  const historyLines = readFileSync(scanHistoryPath, 'utf8').split('\n');
  historyLines.forEach(line => {
    const parts = line.split('\t');
    const u = parts.find(p => p && (p.startsWith('http://') || p.startsWith('https://')));
    if (u) urlsSet.add(u.trim());
  });
}

if (existsSync(pipelinePath)) {
  const pipeLines = readFileSync(pipelinePath, 'utf8').split('\n');
  pipeLines.forEach(line => {
    const m = line.match(/https?:\/\/[^\s#]+/);
    if (m) urlsSet.add(m[0].trim());
  });
}

const allUrls = Array.from(urlsSet);
console.log(`\n📋 Found ${allUrls.length} total unique scraped job URLs in database.`);
console.log(`🚀 Spawning ${CONCURRENCY} Parallel Workers to evaluate simultaneously...\n`);

let processedIndex = 0;
let successCount = 0;

async function worker(workerId) {
  while (processedIndex < allUrls.length) {
    const idx = processedIndex++;
    const url = allUrls[idx];
    console.log(`🤖 [Worker #${workerId}] (${idx + 1}/${allUrls.length}) Evaluating: ${url}`);

    try {
      await execAsync(`node gemini-eval.mjs "${url}"`, { cwd: ROOT });
      successCount++;
      console.log(`  -> ✅ [Worker #${workerId}] Successfully evaluated job ${idx + 1}/${allUrls.length}`);
    } catch (err) {
      console.error(`  -> ⚠️ [Worker #${workerId}] Failed on ${url}: ${err.message.slice(0, 100)}`);
    }
  }
}

// Launch CONCURRENCY parallel workers
const workerPromises = [];
for (let w = 1; w <= CONCURRENCY; w++) {
  workerPromises.push(worker(w));
}

await Promise.all(workerPromises);

console.log(`\n🎉 All ${allUrls.length} jobs processed! (${successCount} successfully evaluated)`);

// 6. Generate Tailored Resumes for Top Match Roles
console.log(`\n📄 Generating tailored 1-page FlowCV PDF resumes for top-scoring jobs...`);
try {
  await execAsync(`node batch/auto-resume-generator.mjs`, { cwd: ROOT });
} catch (err) {
  console.error(`⚠️ Resume generation error: ${err.message}`);
}

// 7. Generate Cold Email Strategies ONLY for explicit emails
console.log(`\n📬 Generating cold email strategies for postings with explicit emails...`);
try {
  await execAsync(`node batch/auto-cold-email-finder.mjs`, { cwd: ROOT });
} catch (err) {
  console.error(`⚠️ Cold email finder error: ${err.message}`);
}

// 8. Export Brand New Excel Workbook
console.log(`\n📊 Generating pristine output/Top_Jobs_Analysis.xlsx...`);
try {
  await execAsync(`node batch/generate-excel-xlsx.mjs`, { cwd: ROOT });
} catch (err) {
  console.error(`⚠️ Excel generation error: ${err.message}`);
}

console.log(`\n====================================================================`);
console.log(`🎉 PARALLEL SCRATCH RE-EVALUATION COMPLETE!`);
console.log(`  - Total Jobs Evaluated: ${successCount}`);
console.log(`  - Fresh Excel File:      output/Top_Jobs_Analysis.xlsx`);
console.log(`  - Fresh CSV File:        output/Top_Jobs_Analysis.csv`);
console.log(`====================================================================`);
