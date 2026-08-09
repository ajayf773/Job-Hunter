#!/usr/bin/env node
/**
 * auto-eval-runner.mjs
 * Fully autonomous parallel batch evaluator.
 * - N workers, each with its own Gemini model
 * - Workers rotate: finish one URL → immediately pick next
 * - Auto-retry with model fallback on 429/validation errors
 * - Tracks done URLs in batch/auto-eval-done.txt
 * - Zero user interaction
 *
 * Usage: node batch/auto-eval-runner.mjs [--workers=4] [--start=1] [--dry-run]
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');

// ── Args ─────────────────────────────────────────────────────────────────────
const rawArgs = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  })
);
const NUM_WORKERS = parseInt(rawArgs.workers ?? '4', 10);
const START_ROW   = parseInt(rawArgs.start   ?? '1', 10);
const DRY_RUN     = rawArgs['dry-run'] === true;

// ── Paths ─────────────────────────────────────────────────────────────────────
const TRIAGE_FILE = path.join(PROJECT_DIR, 'batch', 'triage-results.tsv');
const DONE_FILE   = path.join(PROJECT_DIR, 'batch', 'auto-eval-done.txt');
const LOG_FILE    = path.join(PROJECT_DIR, 'batch', 'auto-eval-runner.log');

// ── Models ────────────────────────────────────────────────────────────────────
// Alternate models across workers to spread RPM (15 RPM each)
const MODEL_POOL = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];
// Fallback chain if primary is rate-limited
const FALLBACK_CHAIN = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];

// Per-model: minimum ms between calls (4.5s = safe for 15 RPM with 3 workers sharing)
const INTER_CALL_MS = 4500;

// ── Logging ───────────────────────────────────────────────────────────────────
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  const line = `[${ts}] ${msg}`;
  console.log(line);
  logStream.write(line + '\n');
}

// ── Queue (shared array + pointer, JS is single-threaded) ────────────────────
let queue = [];
let qi = 0;

function nextUrl() {
  if (qi >= queue.length) return null;
  return queue[qi++];
}

// ── Done-set ──────────────────────────────────────────────────────────────────
function loadDone() {
  if (!fs.existsSync(DONE_FILE)) return new Set();
  return new Set(fs.readFileSync(DONE_FILE, 'utf8').split('\n').filter(Boolean).map(l => l.trim()));
}
function markDone(url) {
  fs.appendFileSync(DONE_FILE, url + '\n');
}

// ── Build queue ───────────────────────────────────────────────────────────────
function buildQueue(done) {
  const rows = fs.readFileSync(TRIAGE_FILE, 'utf8').split('\n').slice(1).filter(Boolean);
  let passCount = 0;
  const urls = [];
  for (const row of rows) {
    const cols = row.split('\t');
    const url = cols[1]?.trim();
    const verdict = cols[4]?.trim();
    if (!url || verdict !== 'PASS') continue;
    passCount++;
    if (passCount < START_ROW) continue;
    if (done.has(url)) { log(`⏭  Already done: ${url}`); continue; }
    urls.push(url);
  }
  return urls;
}

// ── Rate limiter (per model) ──────────────────────────────────────────────────
const lastCall = {};
async function waitSlot(model) {
  const now = Date.now();
  const gap = INTER_CALL_MS - (now - (lastCall[model] ?? 0));
  if (gap > 0) await sleep(gap);
  lastCall[model] = Date.now();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Run one evaluation ────────────────────────────────────────────────────────
function runEval(url, model, wid) {
  return new Promise(resolve => {
    const env = { ...process.env, GEMINI_MODEL: model };
    const child = execFile(
      'node', ['gemini-eval.mjs', url],
      { cwd: PROJECT_DIR, env, timeout: 300_000 },
      (err, stdout, stderr) => {
        if (err) {
          const out = stdout + stderr;
          resolve({
            ok: false,
            is429: out.includes('429') || out.includes('quota') || out.includes('Too Many Requests'),
            isVal: out.includes('failed validation') || out.includes('missing Block'),
            out: out.slice(-400),
          });
        } else {
          resolve({ ok: true });
        }
      }
    );
    child.stdout?.on('data', d => process.stdout.write(`  [W${wid}] ${d}`));
  });
}

// ── Worker ────────────────────────────────────────────────────────────────────
async function worker(wid, primary) {
  log(`[W${wid}] START  model=${primary}`);
  while (true) {
    const url = nextUrl();
    if (!url) { log(`[W${wid}] DONE — queue exhausted`); break; }

    log(`[W${wid}] → ${url}`);

    // Build try-order: primary first, then rest of fallback chain
    const tryModels = [primary, ...FALLBACK_CHAIN.filter(m => m !== primary)];
    let ok = false;

    for (const model of tryModels) {
      await waitSlot(model);

      if (DRY_RUN) {
        log(`[W${wid}] DRY  model=${model}  url=${url}`);
        ok = true;
        break;
      }

      const res = await runEval(url, model, wid);
      if (res.ok) {
        log(`[W${wid}] ✅ ${model} → ${url}`);
        markDone(url);
        ok = true;
        break;
      }
      if (res.is429) {
        log(`[W${wid}] ⚠️  ${model} 429 — wait 30s → fallback`);
        await sleep(30_000);
        continue;
      }
      if (res.isVal) {
        log(`[W${wid}] ⚠️  ${model} validation error → fallback`);
        await sleep(5_000);
        continue;
      }
      log(`[W${wid}] ❌ ${model} hard-fail → fallback\n  ${res.out}`);
    }

    if (!ok) {
      log(`[W${wid}] ⚠️  all models failed — re-queuing: ${url}`);
      queue.push(url);
    }

    await sleep(1_500); // tiny gap before next job
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log('══════════════════════════════════════════════');
  log(`🚀 auto-eval-runner  workers=${NUM_WORKERS}  start=${START_ROW}  dry=${DRY_RUN}`);
  log('══════════════════════════════════════════════');

  const done = loadDone();
  queue = buildQueue(done);
  log(`📋 Queue: ${queue.length} URLs to evaluate`);

  if (queue.length === 0) {
    log('✅ Nothing left to do!');
    process.exit(0);
  }
  if (DRY_RUN) {
    queue.slice(0, 5).forEach(u => log(`   ${u}`));
    if (queue.length > 5) log(`   …and ${queue.length - 5} more`);
    process.exit(0);
  }

  // Progress reporter every 60s
  const timer = setInterval(() => {
    log(`📊 Progress: ${qi}/${queue.length} dispatched, ${queue.length - qi} remaining`);
  }, 60_000);

  // Launch workers, staggered by 3s each to avoid initial RPM spike
  const promises = [];
  for (let i = 0; i < NUM_WORKERS; i++) {
    const model = MODEL_POOL[i % MODEL_POOL.length];
    promises.push(worker(i, model));
    if (i < NUM_WORKERS - 1) await sleep(3_000);
  }

  await Promise.all(promises);
  clearInterval(timer);
  log('══════════════════════════════════════════════');
  log(`🎉 All done! Processed ${queue.length} URLs`);
  log('══════════════════════════════════════════════');
  logStream.end();
}

main().catch(err => {
  log(`💥 Fatal: ${err.message}`);
  process.exit(1);
});
