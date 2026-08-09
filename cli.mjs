#!/usr/bin/env node

/**
 * cli.mjs
 * 
 * Interactive Terminal Chatbot & Career-Ops Pipeline Assistant.
 * Powered directly by Gemini API (3-Key Load Balancer) with zero CLI context token usage.
 * 
 * Features:
 *   - Conversational AI helper for job search, CV, prep, & offer negotiation.
 *   - Slash commands: /scan, /eval <url>, /apply, /excel, /stats, /help, /exit
 * 
 * Usage:
 *   node cli.mjs  OR  npm start
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { execSync } from 'child_process';
import { generateContentBalanced } from './gemini-model-balancer.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const envPath = join(ROOT, '.env');
const cvPath = join(ROOT, 'cv.md');
const profilePath = join(ROOT, 'config', 'profile.yml');
const profileMdPath = join(ROOT, 'modes', '_profile.md');

// Load .env
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(l => {
    const [k, v] = l.split('=');
    if (k && v && !process.env[k.trim()]) process.env[k.trim()] = v.trim();
  });
}

const cvText = existsSync(cvPath) ? readFileSync(cvPath, 'utf8').slice(0, 4000) : '';
const profileMd = existsSync(profileMdPath) ? readFileSync(profileMdPath, 'utf8').slice(0, 3000) : '';

const systemPrompt = `You are Career-Ops AI, an expert career strategist, technical recruiter, and job search assistant for Ajay Marimuthu.
You have full access to his candidate profile, CV background (Python, AI/LLM ETL pipelines, automation, software engineering), and target preferences.

Candidate Context:
${cvText}

Profile & Deal-Breakers:
${profileMd}

Be concise, practical, direct, and encouraging. Format responses in clean terminal markdown.`;

console.clear();
console.log(`====================================================================`);
console.log(`🤖 CAREER-OPS INTERACTIVE AI ASSISTANT & COMMAND HELPER`);
console.log(`====================================================================`);
console.log(`Powered by 3-Key Gemini Load Balancer (0 CLI Tokens burned)`);
console.log(`\nAvailable Commands:`);
console.log(`  /scan       → Scan job portals (LinkedIn, Indeed, Naukri, Jobstreet, ATS)`);
console.log(`  /eval <url> → Evaluate a job URL using Gemini API balancer`);
console.log(`  /apply      → Launch Playwright interactive form auto-filler`);
console.log(`  /excel      → Update output/Top_Jobs_Analysis.xlsx spreadsheet`);
console.log(`  /stats      → View live pipeline metrics & job funnel`);
console.log(`  /help       → Display command menu`);
console.log(`  /exit       → Exit assistant`);
console.log(`====================================================================\n`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '💬 Career-Ops AI > '
});

const conversationHistory = [];

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();

  if (!input) {
    rl.prompt();
    return;
  }

  // Handle Slash Commands
  if (input === '/exit' || input === '/quit') {
    console.log(`\n👋 Goodbye! Good luck with your job search!`);
    process.exit(0);
  }

  if (input === '/help') {
    console.log(`\n📌 Available Commands:`);
    console.log(`  /scan       → Run job portal scanner`);
    console.log(`  /eval <url> → Evaluate job URL with Gemini API`);
    console.log(`  /apply      → Start interactive Playwright application session`);
    console.log(`  /excel      → Re-generate Excel workbook`);
    console.log(`  /stats      → View pipeline statistics`);
    console.log(`  /exit       → Exit interactive helper\n`);
    rl.prompt();
    return;
  }

  if (input === '/scan') {
    console.log(`\n🚀 Triggering multi-portal job scanner...`);
    try {
      execSync(`node scan-apify-multi.mjs`, { cwd: ROOT, stdio: 'inherit' });
    } catch (err) {
      console.error(`⚠️ Scan error: ${err.message}`);
    }
    rl.prompt();
    return;
  }

  if (input.startsWith('/eval')) {
    const url = input.replace('/eval', '').trim();
    if (!url) {
      console.log(`⚠️ Usage: /eval <job-url>`);
    } else {
      console.log(`\n🤖 Evaluating job URL via Gemini API: ${url}...`);
      try {
        execSync(`node gemini-eval.mjs "${url}"`, { cwd: ROOT, stdio: 'inherit' });
      } catch (err) {
        console.error(`⚠️ Evaluation error: ${err.message}`);
      }
    }
    rl.prompt();
    return;
  }

  if (input === '/apply') {
    console.log(`\n🤖 Launching Playwright Application Assistant...`);
    try {
      execSync(`node batch/auto-apply-interactive.mjs`, { cwd: ROOT, stdio: 'inherit' });
    } catch (err) {
      console.error(`⚠️ Auto-apply error: ${err.message}`);
    }
    rl.prompt();
    return;
  }

  if (input === '/excel') {
    console.log(`\n📊 Generating output/Top_Jobs_Analysis.xlsx...`);
    try {
      execSync(`node batch/generate-excel-xlsx.mjs`, { cwd: ROOT, stdio: 'inherit' });
    } catch (err) {
      console.error(`⚠️ Excel generation error: ${err.message}`);
    }
    rl.prompt();
    return;
  }

  if (input === '/stats') {
    console.log(`\n📊 Fetching pipeline stats...`);
    try {
      execSync(`node stats.mjs --summary`, { cwd: ROOT, stdio: 'inherit' });
    } catch (err) {
      console.error(`⚠️ Stats error: ${err.message}`);
    }
    rl.prompt();
    return;
  }

  // Conversational AI Chat via Gemini API Balancer
  try {
    console.log(`\n🤔 Thinking...`);
    const userPrompt = conversationHistory.length > 0 
      ? `Previous Context:\n${conversationHistory.slice(-4).join('\n')}\n\nUser Question: ${input}`
      : input;

    const apiKey = process.env.GEMINI_API_KEY || '';
    const res = await generateContentBalanced(apiKey, systemPrompt, userPrompt);

    if (res && res.text) {
      console.log(`\n🤖 Career-Ops AI:\n${res.text.trim()}\n`);
      conversationHistory.push(`User: ${input}`);
      conversationHistory.push(`AI: ${res.text.trim()}`);
    } else {
      console.log(`\n⚠️ No response received from Gemini API.`);
    }
  } catch (err) {
    console.error(`\n❌ Error calling Gemini AI: ${err.message}`);
  }

  rl.prompt();
});
