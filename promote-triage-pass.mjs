#!/usr/bin/env node
/**
 * promote-triage-pass.mjs
 * Reads batch/triage-results.tsv, picks all PASS jobs,
 * and writes their URLs back to batch/batch-input-promoted.tsv
 * for a full evaluation batch run (--min-score 3.5).
 */

import fs from 'fs';

const RESULTS_FILE = 'batch/triage-results.tsv';
const PROMOTED_FILE = 'batch/batch-input-promoted.tsv';

if (!fs.existsSync(RESULTS_FILE)) {
  console.error('No triage results yet. Run triage-batch.mjs first.');
  process.exit(1);
}

const lines = fs.readFileSync(RESULTS_FILE, 'utf8').trim().split('\n');
const pass = [];
const marginal = [];

for (const line of lines.slice(1)) {
  const cols = line.split('\t');
  const [id, url, notes, score, verdict] = cols;
  if (verdict === 'PASS') {
    pass.push(`${pass.length + 1}\t${url}\ttriage\t${notes}`);
    console.log(`✅ PASS  ${score}  ${notes}`);
  } else if (verdict === 'MARGINAL') {
    marginal.push({ url, notes, score });
    console.log(`⚠️  MARG  ${score}  ${notes}`);
  }
}

fs.writeFileSync(PROMOTED_FILE, pass.join('\n') + '\n', 'utf8');

console.log(`\n=== Promotion Summary ===`);
console.log(`PASS jobs promoted to full eval: ${pass.length}`);
console.log(`MARGINAL (review manually): ${marginal.length}`);
console.log(`\nTo run full eval on PASS jobs:`);
console.log(`  cp batch/batch-input-promoted.tsv batch/batch-input.tsv`);
console.log(`  rm -f batch/batch-state.tsv`);
console.log(`  ./batch/batch-runner.sh --parallel 10 --skip-pdf`);
