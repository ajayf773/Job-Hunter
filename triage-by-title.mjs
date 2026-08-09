#!/usr/bin/env node
/**
 * triage-by-title.mjs  
 * Extend zero-token filtering with smarter title scoring 
 * using the full brief criteria. No fetching, no API calls.
 * Outputs:
 *   batch/triage-results.tsv         — definitive PASS/FAIL by title
 *   batch/triage-needs-fetch.tsv     — ambiguous titles needing JD fetch
 */

import fs from 'fs';

const CANDIDATES_FILE = 'batch/triage-candidates.tsv';
const RESULTS_FILE = 'batch/triage-results.tsv';
const NEEDS_FETCH_FILE = 'batch/triage-needs-fetch.tsv';

// === DEFINITIVE FAIL patterns (title alone tells us enough) ===
const TITLE_FAIL = [
  // sales / BD
  /\b(account executive|account manager|growth.*sales|sales.*manager|business development)\b/i,
  // management without engineering
  /\b(engineering manager|head of|director of|vp of|chief |cto|ceo|coo)\b/i,
  // recruiter
  /\b(recruiter|talent acquisition|sourcer)\b/i,
  // ops/program manager
  /\b(program manager|product operations|operations manager|project manager|scrum)\b/i,
  // pure researcher / academic
  /\b(research scientist|research director|safety researcher|alignment researcher|head of research)\b/i,
  // security specializations not target
  /\b(linux kernel security|account abuse|account compromise|detection.*response|cybersecurity products)\b/i,
  // hardware/infra not target
  /\b(gpu.*engineer|ml accelerator|node infra|kubernetes platform|inference deployment)\b/i,
  // customer success/solutions architect (pre-sales)
  /\b(solutions architect|partner solutions|applied ai architect|client platform|it systems)\b/i,
  // marketing/content
  /\b(product marketing|growth marketing|developer relations|devrel|content)\b/i,
  // pure product
  /\b(product manager|product owner|product management|human data platform.*manager)\b/i,
  // pure finance/legal
  /\b(finance|legal|compliance|accounting|controller)\b/i,
  // fellowship/academic program
  /\bfellows? program\b/i,
  // staff+ roles (too senior)
  /\b(staff\+|senior staff\+|senior staff software)\b/i,
];

// === DEFINITIVE PASS patterns ===
const TITLE_PASS = [
  /\b(data engineer|data engineering)\b/i,
  /\b(ai engineer|ai\/ml|applied ai engineer|ai automation)\b/i,
  /\b(machine learning engineer|ml engineer)\b/i,
  /\b(llm engineer|llmops|genai engineer|gen ai)\b/i,
  /\b(backend engineer|backend developer|software engineer.*backend)\b/i,
  /\b(etl|data pipeline|data platform|data infrastructure)\b/i,
  /\b(mlops|ai platform|ai infrastructure|model.*engineer)\b/i,
  /\b(research engineer|software engineer.*rl|software engineer.*inference)\b/i,
  /\b(analytics engineer|full.?stack.*engineer|software developer)\b/i,
  /\b(member of technical staff|staff engineer)\b/i,
];

// === AMBIGUOUS — need to fetch JD ===
// Everything not matching above goes here

const lines = fs.readFileSync(CANDIDATES_FILE, 'utf8').trim().split('\n');

// Init results file if needed
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, 'id\turl\tnotes\tscore\tverdict\treason\n', 'utf8');
}
// Load already done
const alreadyDone = new Set();
const existingResults = fs.readFileSync(RESULTS_FILE, 'utf8').trim().split('\n');
for (const line of existingResults.slice(1)) {
  const [, url] = line.split('\t');
  if (url) alreadyDone.add(url.trim());
}

const toFetch = [];
const appendResults = [];
let passCount = 0, failCount = 0, ambigCount = 0;

for (const line of lines) {
  const cols = line.split('\t');
  const [id, url, , ...noteParts] = cols;
  const notes = noteParts.join(' ');
  const title = notes.replace(/^[^-]+-\s*/, ''); // strip "Company - " prefix

  if (alreadyDone.has(url)) continue;

  // Priority companies always pass (title still checked for sanity)
  const isPriority = /anthropic|openai|deepmind/i.test(notes);

  // Check definitive FAIL
  const failMatch = TITLE_FAIL.find(re => re.test(title));
  if (failMatch && !isPriority) {
    appendResults.push(`${id}\t${url}\t${notes}\t1.5\tFAIL\ttitle: ${failMatch.toString().replace(/[\/^\\bi]/g,'')}`);
    failCount++;
    continue;
  }

  // Check definitive PASS
  const passMatch = TITLE_PASS.find(re => re.test(title));
  if (passMatch || isPriority) {
    if (isPriority && !passMatch) {
      // Priority company but ambiguous title — still fetch to confirm
      toFetch.push(line);
      ambigCount++;
    } else {
      appendResults.push(`${id}\t${url}\t${notes}\t4.0\tPASS\ttitle: matches archetype`);
      passCount++;
    }
    continue;
  }

  // Ambiguous
  toFetch.push(line);
  ambigCount++;
}

// Write results
if (appendResults.length > 0) {
  fs.appendFileSync(RESULTS_FILE, appendResults.join('\n') + '\n', 'utf8');
}

// Write needs-fetch list
fs.writeFileSync(NEEDS_FETCH_FILE, toFetch.join('\n') + '\n', 'utf8');

console.log('\n=== Title-Only Triage Results ===');
console.log(`✅ PASS (by title): ${passCount}`);
console.log(`❌ FAIL (by title): ${failCount}`);
console.log(`🔍 Needs JD fetch:  ${ambigCount}`);
console.log(`\nResults appended to: batch/triage-results.tsv`);
console.log(`Ambiguous written to: batch/triage-needs-fetch.tsv`);
console.log(`\nEstimated fetch cost: ~${ambigCount} JD fetches × ~3K tokens = ~${(ambigCount*3000).toLocaleString()} tokens`);
