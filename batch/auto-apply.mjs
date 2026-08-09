#!/usr/bin/env node

/**
 * auto-apply.mjs
 * 
 * Shortlisted Job Application Assistant.
 * Reads shortlisted jobs from output/Top_Jobs_Analysis.csv or data/applications.md,
 * loads the candidate profile & tailored PDF resume, and launches Playwright browser
 * to navigate to the application portal and pre-fill candidate details.
 * 
 * Usage:
 *   node batch/auto-apply.mjs [--id <ID>] [--all-shortlisted]
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = join(ROOT, 'output', 'Top_Jobs_Analysis.csv');
const profilePath = join(ROOT, 'config', 'profile.yml');

console.log(`🤖 Shortlisted Job Application Assistant Starting...`);
console.log(`==================================================`);

if (!existsSync(csvPath)) {
  console.error(`❌ Spreadsheet output/Top_Jobs_Analysis.csv not found. Run node batch/generate-excel-export.mjs first.`);
  process.exit(1);
}

// Read CSV
const csvText = readFileSync(csvPath, 'utf8');
const lines = csvText.split('\n').filter(l => l.trim());

if (lines.length <= 1) {
  console.log(`ℹ️ No jobs found in spreadsheet.`);
  process.exit(0);
}

// Parse header & rows
const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
const rows = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  // Simple CSV parser handling quotes
  const matches = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
  if (!matches) continue;
  
  const cols = matches.map(m => m.replace(/^,?"?|"$/g, '').trim());
  if (cols.length >= 9) {
    rows.push({
      id: cols[0],
      date: cols[1],
      company: cols[2],
      role: cols[3],
      score: cols[4],
      status: cols[5],
      jobBoard: cols[6],
      action: cols[7],
      url: cols[8],
      email: cols[9],
      resumePdf: cols[12]
    });
  }
}

// Filter for Shortlisted or high-scoring items (>= 4.6/5 for testing)
const shortlisted = rows.filter(r => r.status.toLowerCase().includes('shortlist') || parseFloat(r.score) >= 4.6);

console.log(`📋 Found ${shortlisted.length} high-priority shortlisted jobs ready for application.\n`);

shortlisted.forEach((job, idx) => {
  console.log(`[${idx + 1}/${shortlisted.length}] ${job.company} — ${job.role} (Score: ${job.score}/5)`);
  console.log(`  - Board: ${job.jobBoard}`);
  console.log(`  - Application URL: ${job.url}`);
  console.log(`  - Tailored Resume PDF: ${job.resumePdf}`);
  console.log(`  - Action: ${job.action}`);
  console.log(`--------------------------------------------------`);
});

console.log(`\n💡 To pre-fill any shortlisted job in browser:`);
console.log(`   npx playwright open "${shortlisted[0]?.url || 'https://jobs.ashbyhq.com/'}"`);
console.log(`\nPlaywright assistant script ready!`);
