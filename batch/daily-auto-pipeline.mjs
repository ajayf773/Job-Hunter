#!/usr/bin/env node

/**
 * daily-auto-pipeline.mjs
 * 
 * Master Orchestrator for Career-Ops (Inspired by n8n daily automation).
 * Runs the end-to-end job pipeline in sequence:
 *   1. Scan Portals & Inbox (scan.mjs)
 *   2. Evaluate Pending Job URLs (batch/auto-eval-runner.mjs)
 *   3. Generate Tailored 1-Page FlowCV Resumes (batch/auto-resume-generator.mjs)
 *   4. Find Named Decision Makers & Draft Emails (batch/auto-cold-email-finder.mjs)
 *   5. Enrich Named Executives (batch/enrich-contacts.mjs)
 *   6. Format Anti-Spam Daily Email Batches (batch/generate-email-batches.mjs)
 *   7. Update Master Excel CSV/TSV File (batch/generate-excel-export.mjs)
 * 
 * Usage:
 *   node batch/daily-auto-pipeline.mjs [--scan]
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shouldScan = process.argv.includes('--scan');

function runStep(title, command) {
  console.log(`\n==================================================`);
  console.log(`🚀 STEP: ${title}`);
  console.log(`==================================================`);
  try {
    execSync(command, { cwd: ROOT, stdio: 'inherit' });
    console.log(`✅ ${title} completed successfully.`);
  } catch (err) {
    console.error(`⚠️ Step '${title}' encountered an issue: ${err.message}`);
  }
}

console.log(`\n🌅 Starting Career-Ops Daily Automated Pipeline...`);
console.log(`Timestamp: ${new Date().toISOString()}\n`);

// Step 1: Unified Multi-Board Scanning (ATS + Apify LinkedIn/Naukri)
if (shouldScan) {
  runStep("1a. Scan Direct ATS Portals (Greenhouse/Ashby/Lever)", "node scan.mjs");
  runStep("1b. Scan Apify Portals (LinkedIn/Indeed/Naukri)", "node scan-apify-multi.mjs");
} else {
  console.log("ℹ️ Skipping live scan. Pass '--scan' to include portal scanning.");
}

// Step 2: Evaluate Pending Roles via Gemini API
runStep("2. Evaluate Pending Jobs via Gemini API", "node batch/auto-eval-runner.mjs");

// Step 3: Generate Tailored FlowCV Resumes
runStep("3. Generate Tailored 1-Page FlowCV Resumes", "node batch/auto-resume-generator.mjs");

// Step 4: Generate Cold Outreach Reports
runStep("4. Generate Executive Cold Email Reports", "node batch/auto-cold-email-finder.mjs");

// Step 5: Enrich Contacts with Named Founders/CEOs/Talent Leads
runStep("5. Enrich Decision-Maker Contacts", "node batch/enrich-contacts.mjs");

// Step 6: Create Anti-Spam Email Batches (20/day limit)
runStep("6. Create Anti-Spam Email Dispatch Batches", "node batch/generate-email-batches.mjs");

// Step 7: Export Master Native Excel Workbook (.xlsx with Interactive Dropdowns) & CSV
runStep("7. Update Master Native Excel Workbook (.xlsx) & CSV Export", "node batch/generate-excel-xlsx.mjs && node batch/generate-excel-export.mjs");

console.log(`\n==================================================`);
console.log(`🎉 DAILY PIPELINE COMPLETE!`);
console.log(`==================================================`);
console.log(`- 📊 Master Excel Spreadsheet: output/Top_Jobs_Analysis.csv`);
console.log(`- 📬 Ready-to-Send Email Batches: output/ready-to-send-emails/`);
console.log(`- 📄 Tailored 1-Page FlowCV Resumes: output/tailored-resumes/`);
console.log(`\nYour job search dashboard is ready for today!\n`);
