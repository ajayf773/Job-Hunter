#!/usr/bin/env node
/**
 * triage-batch.mjs
 * Reads batch/triage-candidates.tsv and runs triage mode on each job
 * using parallel subagents. Outputs to batch/triage-results.tsv.
 * 
 * Usage: node triage-batch.mjs [--limit N] [--offset N]
 */

import fs from 'fs';
import { execSync, spawn } from 'child_process';
import path from 'path';

const PARALLEL = 10;
const RESULTS_FILE = 'batch/triage-results.tsv';
const CANDIDATES_FILE = 'batch/triage-candidates.tsv';
const BRIEF_FILE = 'modes/_brief.md';

// Parse args
let LIMIT = 0;
let OFFSET = 0;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit') LIMIT = parseInt(args[++i]);
  if (args[i] === '--offset') OFFSET = parseInt(args[++i]);
}

if (!fs.existsSync(BRIEF_FILE)) {
  console.error('ERROR: modes/_brief.md not found. Cannot run triage.');
  process.exit(1);
}

const brief = fs.readFileSync(BRIEF_FILE, 'utf8');

// Load already-triaged URLs to skip
const alreadyTriaged = new Set();
if (fs.existsSync(RESULTS_FILE)) {
  const lines = fs.readFileSync(RESULTS_FILE, 'utf8').trim().split('\n');
  for (const line of lines.slice(1)) {
    const cols = line.split('\t');
    if (cols[1]) alreadyTriaged.add(cols[1].trim());
  }
}

// Init results file
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, 'id\turl\tnotes\tscore\tverdict\treason\n', 'utf8');
}

// Load candidates
const allLines = fs.readFileSync(CANDIDATES_FILE, 'utf8').trim().split('\n');
let pending = allLines.filter(line => {
  const cols = line.split('\t');
  return cols[1] && !alreadyTriaged.has(cols[1].trim());
});

if (OFFSET > 0) pending = pending.slice(OFFSET);
if (LIMIT > 0) pending = pending.slice(0, LIMIT);

console.log(`\n=== Triage Batch ===`);
console.log(`Candidates to triage: ${pending.length}`);
console.log(`Already done: ${alreadyTriaged.size}`);
console.log(`Parallel workers: ${PARALLEL}`);
console.log(`\nStarting...\n`);

// Results collector
const results = [];
let completed = 0;
let passed = 0;
let failed = 0;
let marginal = 0;

function appendResult(id, url, notes, score, verdict, reason) {
  const line = `${id}\t${url}\t${notes}\t${score}\t${verdict}\t${reason}\n`;
  fs.appendFileSync(RESULTS_FILE, line, 'utf8');
  results.push({ id, url, notes, score, verdict, reason });
}

async function triageJob(line) {
  const cols = line.split('\t');
  const [id, url, , ...noteParts] = cols;
  const notes = noteParts.join(' ');

  const prompt = `You are a job-hunter-ai triage agent. Your ONLY job is to give a quick go/no-go score.

Read this compact candidate brief carefully:

---
${brief}
---

Now evaluate this job:
URL: ${url}
Title/Company hint: ${notes}

Steps:
1. Fetch the job posting from the URL (use read_url_content or search if needed).
2. If you cannot fetch it (login wall, 404, expired), output: VERDICT: FAIL | SCORE: 0.0 | REASON: Could not fetch JD
3. Otherwise, score it against the brief's archetypes, comp, location, and hard DQ criteria.
4. Output EXACTLY this format on a single line (nothing else):
   VERDICT: PASS | SCORE: X.X | REASON: one sentence
   OR
   VERDICT: FAIL | SCORE: X.X | REASON: one sentence
   OR
   VERDICT: MARGINAL | SCORE: X.X | REASON: one sentence

Do NOT write reports. Do NOT read cv.md or _shared.md or _profile.md. Only read modes/_brief.md which I already provided above. Be fast and decisive.`;

  return new Promise((resolve) => {
    const logFile = `batch/triage-logs/${id}.log`;
    fs.mkdirSync('batch/triage-logs', { recursive: true });

    const agy = spawn('agy', ['-p', prompt], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    agy.stdout.on('data', d => output += d.toString());
    agy.stderr.on('data', d => output += d.toString());

    const timeout = setTimeout(() => {
      agy.kill();
      appendResult(id, url, notes, '0.0', 'FAIL', 'Timeout');
      resolve({ verdict: 'FAIL', score: 0 });
    }, 90000); // 90s timeout per job

    agy.on('close', (code) => {
      clearTimeout(timeout);
      fs.writeFileSync(logFile, output, 'utf8');

      // Parse verdict from output
      const match = output.match(/VERDICT:\s*(PASS|FAIL|MARGINAL)\s*\|\s*SCORE:\s*([\d.]+)\s*\|\s*REASON:\s*(.+)/i);
      if (match) {
        const verdict = match[1].toUpperCase();
        const score = parseFloat(match[2]);
        const reason = match[3].trim().substring(0, 200);
        appendResult(id, url, notes, score.toFixed(1), verdict, reason);
        resolve({ verdict, score });
      } else {
        appendResult(id, url, notes, '0.0', 'FAIL', 'Could not parse triage output');
        resolve({ verdict: 'FAIL', score: 0 });
      }
    });
  });
}

// Process in parallel batches
for (let i = 0; i < pending.length; i += PARALLEL) {
  const batch = pending.slice(i, i + PARALLEL);
  const batchResults = await Promise.allSettled(batch.map(triageJob));
  
  for (const r of batchResults) {
    completed++;
    if (r.status === 'fulfilled') {
      const { verdict } = r.value;
      if (verdict === 'PASS') passed++;
      else if (verdict === 'MARGINAL') marginal++;
      else failed++;
    }
  }

  const pct = Math.round((completed / pending.length) * 100);
  console.log(`Progress: ${completed}/${pending.length} (${pct}%) — PASS: ${passed} | MARGINAL: ${marginal} | FAIL: ${failed}`);
}

console.log(`\n=== Triage Complete ===`);
console.log(`Total triaged: ${completed}`);
console.log(`✅ PASS (→ full eval): ${passed}`);
console.log(`⚠️  MARGINAL: ${marginal}`);
console.log(`❌ FAIL: ${failed}`);
console.log(`\nResults in: batch/triage-results.tsv`);
console.log(`Run: node promote-triage-pass.mjs to push PASS jobs to full evaluation`);
