import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const TRIAGE_RESULTS = 'batch/triage-results.tsv';
const STATE_FILE = 'batch/batch-state.tsv';

if (!fs.existsSync(TRIAGE_RESULTS)) {
  console.error('No triage results found.');
  process.exit(1);
}

// 1. Get all PASS URLs (score >= 3.5)
const triageLines = fs.readFileSync(TRIAGE_RESULTS, 'utf8').trim().split('\n');
const promotedUrls = [];
for (const line of triageLines.slice(1)) {
  const cols = line.split('\t');
  if (cols.length < 5) continue;
  const [id, url, notes, scoreStr, verdict] = cols;
  const score = parseFloat(scoreStr);
  if (verdict === 'PASS' || score >= 3.5) {
    promotedUrls.push({ id, url, notes, score });
  }
}

console.log(`🚀 Found ${promotedUrls.length} promoted jobs from triage-results.`);

// 2. Identify which completed jobs we already have in batch-state
const completedUrls = new Set();
if (fs.existsSync(STATE_FILE)) {
  const stateLines = fs.readFileSync(STATE_FILE, 'utf8').trim().split('\n');
  for (const line of stateLines.slice(1)) {
    const cols = line.split('\t');
    if (cols[2] === 'completed' && cols[1]) {
      completedUrls.add(cols[1].trim());
    }
  }
}

// Filter to only evaluate newly promoted jobs
const toEvaluate = promotedUrls.filter(p => !completedUrls.has(p.url.trim()));
console.log(`📈 Running evaluations for ${toEvaluate.length} pending promoted jobs...`);

const reportMatches = [];

for (const job of toEvaluate) {
  console.log(`\nEvaluating: ${job.notes} (${job.url})`);
  try {
    // Run gemini-eval.mjs on each URL directly!
    // Using execSync redirects output of evaluations to console
    execSync(`node gemini-eval.mjs "${job.url}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Failed evaluating ${job.url}: ${err.message}`);
  }
}

console.log('\n✅ All evaluations finished.');
