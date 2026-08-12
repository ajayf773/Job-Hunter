#!/usr/bin/env node
/**
 * zero-token-filter.mjs
 * Stage 0: Filter batch-input.tsv by job title keywords before any AI triage.
 * Reads the "notes" column (Company - Title) and kills obvious mismatches.
 * Writes:
 *   batch/triage-candidates.tsv  — jobs to send to triage
 *   batch/title-discarded.tsv    — jobs killed at title level (auditable)
 */

import fs from 'fs';

const PASS_KEYWORDS = [
  'ai', 'ml', 'machine learning', 'data engineer', 'data platform', 'etl',
  'llm', 'nlp', 'python', 'backend engineer', 'software engineer', 'mlops',
  'llmops', 'applied ai', 'ai platform', 'gen ai', 'genai', 'generative',
  'analytics engineer', 'data infrastructure', 'data science', 'ai engineer',
  'agentic', 'rag', 'lm', 'foundation model', 'ai infrastructure',
  'platform engineer', 'data scientist', 'full stack', 'fullstack',
  'deep learning', 'neural', 'embedding', 'vector', 'inference',
  'model', 'pipeline', 'automation engineer', 'ai automation',
  'member of technical staff', 'staff engineer', 'senior engineer',
  'software developer', 'backend developer', 'api engineer'
];

const FAIL_KEYWORDS = [
  'solutions engineer', 'technical account', 'support engineer',
  'customer success', 'customer support', 'sales engineer',
  'account manager', 'account executive', 'business development',
  'manual test', 'qa engineer', 'quality assurance',
  'data entry', 'data analyst', 'business analyst',
  'recruiter', 'talent', 'hr ', 'human resources',
  'marketing', 'content', 'social media', 'seo',
  'finance', 'accounting', 'legal', 'compliance officer',
  'operations manager', 'project manager', 'program manager',
  'product manager', 'product owner', 'scrum master',
  'designer', 'ux ', 'ui ', 'graphic',
  'technical writer', 'documentation',
  'helpdesk', 'help desk', 'bpo', 'call center',
  'administrative', 'data entry', 'payroll',
  'agent strategist', // pre-sales
  'developer relations', 'devrel',
  'field engineer', // often hardware
  'hardware engineer', 'mechanical engineer', 'electrical engineer',
  'manufacturing', 'supply chain', 'logistics',
  'cybersecurity', 'penetration test', 'soc analyst', // not target
  'network engineer', 'systems administrator', 'sysadmin',
  'ios engineer', 'android engineer', 'mobile engineer',
  'embedded', 'firmware', 'fpga'
];

// Priority overrides — always pass regardless of title
const PRIORITY_COMPANIES = [
  'anthropic', 'openai', 'deepmind', 'google ai', 'google deepmind',
  'cohere', 'mistral', 'stability ai', 'hugging face'
];

const inputFile = 'batch/batch-input.tsv';
const stateFile = 'batch/batch-state.tsv';

if (!fs.existsSync(inputFile)) {
  console.error('batch/batch-input.tsv not found');
  process.exit(1);
}

// Read already completed/failed IDs to skip them
const alreadyDone = new Set();
if (fs.existsSync(stateFile)) {
  const stateLines = fs.readFileSync(stateFile, 'utf8').trim().split('\n');
  for (const line of stateLines.slice(1)) {
    const cols = line.split('\t');
    const id = cols[0];
    const status = cols[2];
    if (status === 'completed' || status === 'skipped') {
      alreadyDone.add(id);
    }
  }
}

const lines = fs.readFileSync(inputFile, 'utf8').trim().split('\n');

const candidates = [];
const discarded = [];
let alreadyDoneCount = 0;

for (const line of lines) {
  const cols = line.split('\t');
  if (cols.length < 2) continue;
  const [id, url, source, ...noteParts] = cols;
  const notes = noteParts.join(' ').toLowerCase();
  const urlLower = url.toLowerCase();

  if (alreadyDone.has(id)) {
    alreadyDoneCount++;
    continue;
  }

  // Extract company name for priority check
  const isPriority = PRIORITY_COMPANIES.some(c => notes.includes(c) || urlLower.includes(c.replace(' ', '')));
  if (isPriority) {
    candidates.push(line);
    continue;
  }

  // Check hard FAIL keywords first
  const failMatch = FAIL_KEYWORDS.find(kw => new RegExp(`\\b${kw.trim()}\\b`).test(notes));
  if (failMatch) {
    discarded.push(`${id}\t${url}\t${noteParts.join(' ')}\ttitle-filter: "${failMatch}"`);
    continue;
  }

  // Check PASS keywords
  const passMatch = PASS_KEYWORDS.find(kw => new RegExp(`\\b${kw.trim()}\\b`).test(notes) || urlLower.includes(kw));
  if (passMatch) {
    candidates.push(line);
  } else {
    // No keyword match at all — discard (title is too generic or unknown)
    discarded.push(`${id}\t${url}\t${noteParts.join(' ')}\ttitle-filter: no matching keyword in title`);
  }
}

fs.writeFileSync('batch/triage-candidates.tsv', candidates.join('\n') + '\n', 'utf8');
fs.writeFileSync('batch/title-discarded.tsv', discarded.join('\n') + '\n', 'utf8');

console.log(`\n=== Zero-Token Title Filter Results ===`);
console.log(`Total jobs in batch:   ${lines.length}`);
console.log(`Already done (skip):   ${alreadyDoneCount}`);
console.log(`→ CANDIDATES for triage: ${candidates.length}`);
console.log(`→ DISCARDED (title mismatch): ${discarded.length}`);
console.log(`\nFiles written:`);
console.log(`  batch/triage-candidates.tsv (${candidates.length} jobs)`);
console.log(`  batch/title-discarded.tsv   (${discarded.length} discarded)`);
console.log(`\nEstimated triage token cost @ 2K/job: ~${(candidates.length * 2000).toLocaleString()} tokens`);
console.log(`vs full eval @ 80K/job: ~${(candidates.length * 80000).toLocaleString()} tokens`);
console.log(`Savings: ${Math.round((1 - 2/80) * 100)}%`);
