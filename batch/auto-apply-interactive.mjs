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

  // We now rely entirely on the Gemini RAG generator for custom questions below.

  // Gemini API Q&A Generator for open-ended questions
  const emptyTextareas = await page.locator('textarea:not([value]), textarea:has-text("")').all();
  for (const area of emptyTextareas) {
    try {
      let nameAttr = await area.evaluate(node => {
        if (node.labels && node.labels.length > 0) return node.labels[0].innerText;
        const parentLabel = node.closest('label');
        if (parentLabel) return parentLabel.innerText;
        const id = node.getAttribute('id');
        if (id) {
          const linkedLabel = document.querySelector(`label[for="${id}"]`);
          if (linkedLabel) return linkedLabel.innerText;
        }
        let prev = node.previousElementSibling;
        if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'DIV' || prev.tagName === 'SPAN')) return prev.innerText;
        return node.getAttribute('placeholder') || node.getAttribute('name') || 'Question';
      }).catch(() => 'Question');
      nameAttr = nameAttr.replace(/[\r\n]+/g, ' ').trim();
      if (nameAttr && nameAttr.length > 3) {
        console.log(`🤖 Requesting Gemini API for custom answer: "${nameAttr}"...`);
        const apiKey = process.env.GEMINI_API_KEY || '';
        const pastMemories = Object.entries(profile.custom_answers || {})
          .map(([k,v]) => `- Question like "${k}": "${v}"`)
          .join('\n');
          
        const geminiRes = await generateContentBalanced(
          apiKey,
          "You are an AI job application assistant. Your goal is to auto-fill form questions accurately based on the user's past answers. DO NOT hallucinate info not present in the past memory.",
          `Write a 1-2 sentence response for ${job.company} - ${job.role} to the question: "${nameAttr}".\n\nHere is your RAG Memory Bank of the user's past answers. Reuse these facts and tones exactly if they apply:\n${pastMemories || "No past answers yet."}\n\nCandidate core traits: AI/Python automation engineer, values velocity.`
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

// Import readdirSync from fs and ExcelJS
import { readdirSync } from 'fs';
import ExcelJS from 'exceljs';

// Sync manual Excel edits to legacy CSV just in case
console.log(`🔄 Syncing any manual changes from legacy paths...`);
execSync('node batch/generate-excel-xlsx.mjs', { stdio: 'ignore' });

const excelReportsDir = join(ROOT, 'output', 'excel-reports');
let availableExcelFiles = [];
if (existsSync(excelReportsDir)) {
  availableExcelFiles = readdirSync(excelReportsDir).filter(f => f.startsWith('Top_Jobs_Analysis_') && f.endsWith('.xlsx')).sort().reverse();
}

if (availableExcelFiles.length === 0) {
  console.error(`❌ No daily Excel reports found in output/excel-reports/`);
  process.exit(1);
}

console.log(`\n📂 Available Daily Excel Reports:`);
availableExcelFiles.forEach((file, idx) => {
  console.log(`   [${idx}] ${file}`);
});

const rlExcel = readline.createInterface({ input: process.stdin, output: process.stdout });
const selection = await new Promise(resolve => rlExcel.question(`\nSelect the index of the file to load for applications [default 0]: `, resolve));
rlExcel.close();

const selectedIndex = parseInt(selection.trim(), 10) || 0;
const selectedFile = availableExcelFiles[selectedIndex] || availableExcelFiles[0];
const selectedFilePath = join(excelReportsDir, selectedFile);
console.log(`\n📄 Loading shortlisted jobs from: ${selectedFile}...`);

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(selectedFilePath);
const sheet = workbook.getWorksheet('Top Jobs');

const shortlisted = [];
if (sheet) {
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const id = row.getCell(1).value?.toString() || '';
      const company = row.getCell(3).value?.toString() || '';
      const role = row.getCell(4).value?.toString() || '';
      const score = parseFloat(row.getCell(5).value?.toString()) || 0;
      const status = (row.getCell(6).value?.toString() || '').toLowerCase();
      const jobBoard = row.getCell(7).value?.toString() || '';
      const urlMatch = row.getCell(9).value;
      const applicationUrl = (urlMatch && urlMatch.hyperlink) ? urlMatch.hyperlink : (urlMatch?.toString() || '');
      
      if (!status.includes('applied') && !status.includes('reject') && !status.includes('pass') && status.includes('shortlisted')) {
        shortlisted.push({ id, company, role, score, status, jobBoard, url: applicationUrl });
      }
    }
  });
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

  let context = null;
  let page = null;

  async function ensureBrowserOpen() {
    if (!browser || !browser.isConnected()) {
      console.log(`🌐 Launching Playwright browser...`);
      browser = await chromium.launch({ headless: false });
    }
    context = await browser.newContext();
    page = await context.newPage();
    console.log(`🌐 Opening portal URL: ${job.url}...`);
    await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await fillFormOnCurrentPage(page, job);
  }

  try {
    await ensureBrowserOpen();

    let activeLoop = true;
    while (activeLoop) {
      console.log(`\n--------------------------------------------------`);
      console.log(`🎮 APPLICATION CONTROL MENU for #${job.id} ${job.company}:`);
      console.log(`   y = Applied (Submitted! Sync status to Applied)`);
      console.log(`   n = Decide Not to Apply (Skip/Pass & sync to Excel)`);
      console.log(`   r = Reject & Learn Exclusion Rule (Save reason to AI rules)`);
      console.log(`   f = Refill Form (Trigger auto-fill on active tab)`);
      console.log(`   o = Re-open Browser (Re-launch & open portal if closed)`);
      console.log(`--------------------------------------------------`);

      const cmd = (await ask(`Select action (y/n/r/f/o): `)).trim().toLowerCase();

      if (cmd === 'o' || cmd === 'open' || cmd === 'reopen') {
        console.log(`🔄 Re-opening browser for ${job.company}...`);
        try {
          if (context) await context.close().catch(() => {});
        } catch {}
        await ensureBrowserOpen();
        console.log(`✅ Browser re-opened and form pre-filled!`);
        continue;
      }

      if (cmd === 'f' || cmd === 'fill' || cmd === 'refill') {
        try {
          const pages = context ? context.pages() : [];
          const activePage = pages.length > 0 ? pages[pages.length - 1] : null;
          if (!activePage || activePage.isClosed()) {
            console.log(`⚠️ Browser tab was closed! Re-opening browser...`);
            await ensureBrowserOpen();
          } else {
            console.log(`🔄 Re-running auto-fill engine on active page: ${activePage.url()}...`);
            await fillFormOnCurrentPage(activePage, job);
            console.log(`✅ Auto-fill complete on ${activePage.url()}`);
          }
        } catch (err) {
          console.log(`⚠️ Browser was closed (${err.message}). Re-opening browser...`);
          await ensureBrowserOpen();
        }
        continue;
      }

      if (cmd === 'y' || cmd === 'yes' || cmd === 'applied') {
        // Extract & Learn any new answers
        try {
          const pages = context ? context.pages() : [];
          const activePage = pages.length > 0 ? pages[pages.length - 1] : null;
          if (activePage && !activePage.isClosed()) {
            console.log(`🧠 Inspecting form inputs for new answers to learn...`);
            const textareas = await activePage.locator('textarea, input[type="text"]').all();
            let learnedCount = 0;
            for (const el of textareas) {
              try {
                const val = await el.inputValue();
                let labelText = await el.evaluate(node => {
                  if (node.labels && node.labels.length > 0) return node.labels[0].innerText;
                  const parentLabel = node.closest('label');
                  if (parentLabel) return parentLabel.innerText;
                  const id = node.getAttribute('id');
                  if (id) {
                    const linkedLabel = document.querySelector(`label[for="${id}"]`);
                    if (linkedLabel) return linkedLabel.innerText;
                  }
                  let prev = node.previousElementSibling;
                  if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'DIV')) return prev.innerText;
                  return '';
                }).catch(() => '');
                
                if (!labelText || labelText.trim() === '') {
                  labelText = (await el.getAttribute('placeholder')) || (await el.getAttribute('name')) || '';
                }
                
                const labelKey = labelText.replace(/[\r\n]+/g, ' ').trim().slice(0, 100);
                const ignoreKeys = ['first name', 'last name', 'email', 'phone', 'first_name', 'last_name'];
                
                if (val && val.length > 5 && labelKey && !ignoreKeys.some(k => labelKey.toLowerCase().includes(k))) {
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
          }
        } catch {}

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

    if (context) await context.close().catch(() => {});
  } catch (err) {
    console.error(`⚠️ Notice: ${err.message}`);
    if (context) await context.close().catch(() => {});
  }
}

if (browser) await browser.close();
rl.close();
console.log(`\n🎉 Interactive Application Session Complete!`);
