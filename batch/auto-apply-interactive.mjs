#!/usr/bin/env node

/**
 * auto-apply-interactive.mjs
 * 
 * Continuous Self-Learning Interactive Application Assistant.
 * Iterates through shortlisted jobs in output/Top_Jobs_Analysis.xlsx, opens Playwright Chromium,
 * pre-fills candidate details & attaches tailored 1-page FlowCV PDF resume across ANY REDIRECT,
 * AUTOMATICALLY GENERATES tailored answers for open-ended questions using Gemini API (0 CLI Tokens),
 * AUTOMATICALLY CAPTURES & REMEMBERS any custom answers you type into the browser,
 * OFFERS POST-INSPECTION SKIP/REJECT/APPLIED COMMANDS TO UPDATE EXCEL/TRACKER IMMEDIATELY,
 * AND LEARNS FROM YOUR REJECTIONS to update evaluation rules in modes/_profile.md!
 * 
 * Usage:
 *   node batch/auto-apply-interactive.mjs
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import { generateContentBalanced } from '../gemini-model-balancer.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profileJsonPath = join(ROOT, 'config', 'apply-profile.json');
const profileMdPath = join(ROOT, 'modes', '_profile.md');
const csvPath = join(ROOT, 'output', 'Top_Jobs_Analysis.csv');
const envPath = join(ROOT, '.env');

// Load .env
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(l => {
    const [k, v] = l.split('=');
    if (k && v && !process.env[k.trim()]) process.env[k.trim()] = v.trim();
  });
}

if (!existsSync(profileJsonPath)) {
  console.error(`❌ config/apply-profile.json not found.`);
  process.exit(1);
}

let profile = JSON.parse(readFileSync(profileJsonPath, 'utf8'));
if (!profile.custom_answers) profile.custom_answers = {};

function saveProfileMemory(updatedProfile) {
  writeFileSync(profileJsonPath, JSON.stringify(updatedProfile, null, 2), 'utf8');
}

function saveRejectionPatternToRules(company, role, reason) {
  if (!reason || !reason.trim()) return;
  const timestamp = new Date().toISOString().split('T')[0];
  const ruleLine = `- **Learned Exclusion (${timestamp})**: Avoid roles like ${company} - ${role} due to user rejection pattern: "${reason.trim()}".`;
  
  if (existsSync(profileMdPath)) {
    const content = readFileSync(profileMdPath, 'utf8');
    if (!content.includes(reason.trim())) {
      const updated = content.replace('## Your Deal-Breakers & Culture Filters', `## Your Deal-Breakers & Culture Filters\n${ruleLine}`);
      writeFileSync(profileMdPath, updated, 'utf8');
      console.log(`\n==================================================`);
      console.log(`🧠 AI LEARNER UPDATE ENFORCED:`);
      console.log(`  - Target: ${company} — ${role}`);
      console.log(`  - Reason Captured: "${reason.trim()}"`);
      console.log(`  - File Updated: modes/_profile.md`);
      console.log(`  - Enforcement: Future evaluations via Gemini API will read this rule & automatically disqualify matching roles!`);
      console.log(`==================================================\n`);
    }
  }
}

function updateJobStatusInTrackerAndExcel(jobId, newStatus, note = '') {
  try {
    console.log(`📊 Updating Tracker & Excel status for #${jobId} to '${newStatus}'...`);
    execSync(`node set-status.mjs ${jobId} ${newStatus} --note "${note || 'Updated via Interactive Assistant'}"`, { cwd: ROOT, stdio: 'inherit' });
    execSync(`node batch/generate-excel-xlsx.mjs`, { cwd: ROOT, stdio: 'pipe' });
    console.log(`✅ Status updated to '${newStatus}' in data/applications.md & output/Top_Jobs_Analysis.xlsx!`);
  } catch (err) {
    console.error(`⚠️ Status update warning: ${err.message}`);
  }
}

async function fillFormOnCurrentPage(page, job) {
  console.log(`📝 Auto-filling candidate fields on active page: ${page.url()}...`);

  // Personal Info
  const firstNameInput = page.locator('input[name*="first" i], input[id*="first" i], input[autocomplete="given-name"]');
  if (await firstNameInput.count() > 0) await firstNameInput.first().fill(profile.personal.first_name);

  const lastNameInput = page.locator('input[name*="last" i], input[id*="last" i], input[autocomplete="family-name"]');
  if (await lastNameInput.count() > 0) await lastNameInput.first().fill(profile.personal.last_name);

  const nameInput = page.locator('input[name*="name" i]:not([name*="first"]):not([name*="last"]), input[id="name" i]');
  if (await nameInput.count() > 0) await nameInput.first().fill(`${profile.personal.first_name} ${profile.personal.last_name}`);

  const emailInput = page.locator('input[type="email"], input[name*="email" i]');
  if (await emailInput.count() > 0) await emailInput.first().fill(profile.personal.email);

  const phoneInput = page.locator('input[type="tel"], input[name*="phone" i]');
  if (await phoneInput.count() > 0) await phoneInput.first().fill(profile.personal.phone);

  const githubInput = page.locator('input[name*="github" i], input[id*="github" i]');
  if (await githubInput.count() > 0) await githubInput.first().fill(profile.personal.github);

  const portfolioInput = page.locator('input[name*="portfolio" i], input[name*="website" i], input[name*="url" i]');
  if (await portfolioInput.count() > 0) await portfolioInput.first().fill(profile.personal.portfolio || profile.personal.github);

  // Pre-fill Saved Memory Q&A
  for (const [key, answer] of Object.entries(profile.custom_answers)) {
    const matchLocator = page.locator(`textarea[name*="${key}" i], input[name*="${key}" i], textarea[id*="${key}" i]`);
    if (await matchLocator.count() > 0) {
      console.log(`  -> 🧠 Auto-filled saved answer from memory for "${key}"`);
      await matchLocator.first().fill(answer);
    }
  }

  // Gemini API Q&A Generator for open-ended questions
  const emptyTextareas = await page.locator('textarea:not([value]), textarea:has-text("")').all();
  for (const area of emptyTextareas) {
    try {
      const nameAttr = (await area.getAttribute('name')) || (await area.getAttribute('id')) || (await area.getAttribute('placeholder')) || 'Question';
      if (nameAttr && nameAttr.length > 3) {
        console.log(`🤖 Requesting Gemini API for custom answer: "${nameAttr}"...`);
        const apiKey = process.env.GEMINI_API_KEY || '';
        const geminiRes = await generateContentBalanced(
          apiKey,
          "You are a professional software engineer answering application questions concisely in 2 sentences.",
          `Write a 2-sentence application response for ${job.company} - ${job.role} to the question: "${nameAttr}". Candidate stats: Python, LLM ETL pipelines, fast velocity.`
        );
        if (geminiRes && geminiRes.text) {
          await area.fill(geminiRes.text.trim());
          console.log(`  -> ✅ Gemini API generated answer for "${nameAttr}"`);
        }
      }
    } catch {}
  }

  // Attach Resume PDF
  if (job.resumePdf) {
    const pdfAbsPath = resolve(ROOT, job.resumePdf);
    if (existsSync(pdfAbsPath)) {
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        console.log(`📄 Attaching tailored PDF resume: ${pdfAbsPath}`);
        await fileInput.first().setInputFiles(pdfAbsPath);
      }
    }
  }
}

const csvText = readFileSync(csvPath, 'utf8');
const lines = csvText.split('\n').filter(l => l.trim());

const shortlisted = [];
for (let i = 1; i < lines.length; i++) {
  const matches = lines[i].match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
  if (!matches) continue;
  const cols = matches.map(m => m.replace(/^,?"?|"$/g, '').trim());
  if (cols.length >= 9) {
    const status = (cols[5] || '').toLowerCase();
    const score = parseFloat(cols[4]) || 0;
    
    if (status.includes('applied') || status.includes('reject') || status.includes('pass')) {
      continue;
    }

    if (status.includes('shortlist') || score >= 4.6) {
      shortlisted.push({
        id: cols[0],
        company: cols[2],
        role: cols[3],
        score: cols[4],
        status: cols[5],
        jobBoard: cols[6],
        url: cols[8],
        resumePdf: cols[12]
      });
    }
  }
}

console.log(`🤖 Continuous Self-Learning Application Assistant Starting...`);
console.log(`==================================================`);
console.log(`📋 Found ${shortlisted.length} pending shortlisted application targets.`);
console.log(`🧠 Dynamic Multi-Page Auto-Fill & Excel Sync Enabled.`);
console.log(`==================================================\n`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

let browser = null;

for (let i = 0; i < shortlisted.length; i++) {
  const job = shortlisted[i];
  console.log(`\n👉 [${i + 1}/${shortlisted.length}] Next Target: #${job.id} — ${job.company} — ${job.role}`);
  console.log(`   - Fit Score: ${job.score}/5`);
  console.log(`   - Portal URL: ${job.url}`);
  console.log(`   - Tailored Resume: ${job.resumePdf || 'Default CV'}`);

  const ans = await ask(`\nLaunch browser & pre-fill for ${job.company}? (y/n/reject/skip/exit): `);
  const inputCmd = ans.trim().toLowerCase();

  if (inputCmd === 'exit') break;

  if (inputCmd === 'r' || inputCmd === 'reject' || inputCmd === 'n' || inputCmd === 'skip') {
    const reason = await ask(`💬 Rejection feedback for AI learning (Press Enter to skip reason): `);
    if (reason && reason.trim()) {
      saveRejectionPatternToRules(job.company, job.role, reason);
    }
    updateJobStatusInTrackerAndExcel(job.id, 'Rejected', reason || 'User skipped/rejected');
    continue;
  }

  if (!browser) {
    browser = await chromium.launch({ headless: false });
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`🌐 Navigating to ${job.url}...`);
  try {
    await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Auto-fill initial page
    await fillFormOnCurrentPage(page, job);

    let activeLoop = true;
    while (activeLoop) {
      console.log(`\n--------------------------------------------------`);
      console.log(`🎮 APPLICATION CONTROL MENU for #${job.id} ${job.company}:`);
      console.log(`   y = Applied (Submitted! Sync status to Applied)`);
      console.log(`   n = Decide Not to Apply (Skip/Pass & sync to Excel)`);
      console.log(`   r = Reject & Learn Exclusion Rule (Save reason to AI rules)`);
      console.log(`   f = Refill Form (Trigger auto-fill & resume upload on new page/tab)`);
      console.log(`--------------------------------------------------`);

      const cmd = (await ask(`Select action (y/n/r/f): `)).trim().toLowerCase();

      if (cmd === 'f' || cmd === 'fill' || cmd === 'refill') {
        // Refill active page or latest tab
        const pages = context.pages();
        const activePage = pages[pages.length - 1] || page;
        console.log(`🔄 Re-running auto-fill engine on active page: ${activePage.url()}...`);
        await fillFormOnCurrentPage(activePage, job);
        console.log(`✅ Auto-fill complete on ${activePage.url()}`);
        continue;
      }

      if (cmd === 'y' || cmd === 'yes' || cmd === 'applied') {
        // Extract & Learn any new answers
        console.log(`🧠 Inspecting form inputs for new answers to learn...`);
        const textareas = await page.locator('textarea, input[type="text"]').all();
        let learnedCount = 0;
        for (const el of textareas) {
          try {
            const val = await el.inputValue();
            const name = (await el.getAttribute('name')) || (await el.getAttribute('id')) || '';
            const placeholder = (await el.getAttribute('placeholder')) || '';
            const labelKey = (name || placeholder).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30);
            if (val && val.length > 5 && labelKey && !['first_name', 'last_name', 'email', 'phone', 'name'].includes(labelKey)) {
              if (!profile.custom_answers[labelKey] || profile.custom_answers[labelKey] !== val) {
                profile.custom_answers[labelKey] = val;
                learnedCount++;
              }
            }
          } catch {}
        }
        if (learnedCount > 0) {
          saveProfileMemory(profile);
          console.log(`🎉 Learned & saved ${learnedCount} new Q&A answers!`);
        }

        updateJobStatusInTrackerAndExcel(job.id, 'Applied', 'Submitted via Interactive Assistant');
        activeLoop = false;
      } else if (cmd === 'n' || cmd === 'no' || cmd === 'skip' || cmd === 'pass') {
        updateJobStatusInTrackerAndExcel(job.id, 'Pass', 'User inspected link and decided not to apply');
        activeLoop = false;
      } else if (cmd === 'r' || cmd === 'reject') {
        const reason = await ask(`💬 Rejection feedback for AI learning (Press Enter to skip reason): `);
        if (reason && reason.trim()) {
          saveRejectionPatternToRules(job.company, job.role, reason);
        }
        updateJobStatusInTrackerAndExcel(job.id, 'Rejected', reason || 'User rejected after inspecting link');
        activeLoop = false;
      }
    }

    await context.close();
  } catch (err) {
    console.error(`⚠️ Error opening page: ${err.message}`);
    await context.close();
  }
}

if (browser) await browser.close();
rl.close();
console.log(`\n🎉 Interactive Application Session Complete!`);
