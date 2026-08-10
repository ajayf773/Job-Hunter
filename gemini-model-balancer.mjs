/**
 * gemini-model-balancer.mjs
 * 
 * High-Throughput Smart Rate Limit Balancer & API Health Matrix Engine.
 * 
 * Features:
 *  1. Multi-API Key Support: Round-robins across all configured API keys (from config/gemini-keys.json or env).
 *  2. Multi-Model Load Distribution: Rotates across production models.
 *  3. Dynamic Rate Limit (RPM/RPD) & Cooldown Tracking:
 *     - If 429 RPM is hit: Instantly locks (Key, Model) for 60s.
 *     - If 429 RPD / Daily Quota is hit: Instantly locks Key for 24 hours.
 *  4. Health Analyzer (analyzeQuotaHealth): Reports live usage, active models, and paused keys.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'batch', 'gemini-balancer-state.json');
const KEYS_FILE = path.join(__dirname, 'config', 'gemini-keys.json');

const MODEL_CONFIGS = [
  { name: 'gemini-3.5-flash-lite', rpm: 15, rpd: 1500 },
  { name: 'gemini-2.5-flash', rpm: 15, rpd: 1500 },
  { name: 'gemini-3.5-flash', rpm: 15, rpd: 1500 },
  { name: 'gemini-2.0-flash', rpm: 15, rpd: 1500 },
  { name: 'gemini-2.5-pro', rpm: 5, rpd: 100 }
];

let globalKeyIndex = 0;

// Memory Cooldown Maps
const pairCooldowns = new Map(); // key: "keyIdx_modelName", val: unpauseTimestamp
const keyDailyExhausted = new Map(); // key: keyIdx, val: unpauseTimestamp

function loadApiKeys() {
  const keys = new Set();

  if (process.env.GEMINI_API_KEYS) {
    process.env.GEMINI_API_KEYS.split(',').forEach(k => {
      const clean = k.trim();
      if (clean && !clean.includes('HERE')) keys.add(clean);
    });
  }

  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('HERE')) {
    keys.add(process.env.GEMINI_API_KEY.trim());
  }

  const API_KEYS_FILE = path.join(__dirname, 'config', 'api-keys.json');
  if (fs.existsSync(API_KEYS_FILE)) {
    try {
      const multiData = JSON.parse(fs.readFileSync(API_KEYS_FILE, 'utf-8'));
      if (Array.isArray(multiData.gemini)) {
        multiData.gemini.forEach(k => {
          const clean = String(k).trim();
          if (clean && !clean.includes('HERE')) keys.add(clean);
        });
      }
    } catch {}
  }

  if (fs.existsSync(KEYS_FILE)) {
    try {
      const jsonKeys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
      if (Array.isArray(jsonKeys)) {
        jsonKeys.forEach(k => {
          const clean = k.trim();
          if (clean && !clean.includes('HERE')) keys.add(clean);
        });
      }
    } catch {}
  }

  const keyList = Array.from(keys);
  if (keyList.length === 0) {
    throw new Error("❌ No valid Gemini API Keys found in config/gemini-keys.json or GEMINI_API_KEYS.");
  }
  return keyList;
}

function initTrackerState() {
  const batchDir = path.dirname(STATE_FILE);
  if (!fs.existsSync(batchDir)) fs.mkdirSync(batchDir, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ history: [] }, null, 2), 'utf-8');
  }
}

function getUsageStats() {
  initTrackerState();
  let state;
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    state = { history: [] };
  }

  const now = Date.now();
  state.history = state.history.filter(h => h.time > now - 86400000);
  return state;
}

function saveHistory(state, keyHash, modelName) {
  state.history.push({
    key: keyHash,
    model: modelName,
    time: Date.now()
  });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Analyzes and prints live Quota & Rate Limit Health Status across all API Keys & Models
 */
export function analyzeQuotaHealth() {
  const apiKeys = loadApiKeys();
  const state = getUsageStats();
  const now = Date.now();
  const oneMinAgo = now - 60000;
  const startOfToday = new Date().setHours(0,0,0,0);

  console.log(`\n====================================================================`);
  console.log(`📊 GEMINI API LOAD BALANCER & RATE-LIMIT HEALTH MATRIX`);
  console.log(`====================================================================`);
  console.log(`🔑 Configured Keys: ${apiKeys.length} active keys`);

  apiKeys.forEach((key, idx) => {
    const keyHash = `key_${idx}`;
    const isDailyPaused = keyDailyExhausted.has(idx) && keyDailyExhausted.get(idx) > now;
    const keyStatusStr = isDailyPaused ? `🔴 DAILY QUOTA EXHAUSTED (Paused until midnight)` : `🟢 ACTIVE`;

    console.log(`\n🔑 Key #${idx + 1} [${key.slice(0, 8)}...${key.slice(-4)}] — Status: ${keyStatusStr}`);

    MODEL_CONFIGS.forEach(m => {
      const pairKey = `${idx}_${m.name}`;
      const minCount = state.history.filter(h => h.key === keyHash && h.model === m.name && h.time > oneMinAgo).length;
      const dayCount = state.history.filter(h => h.key === keyHash && h.model === m.name && h.time > startOfToday).length;
      const isRPMCooldown = pairCooldowns.has(pairKey) && pairCooldowns.get(pairKey) > now;

      let modelStatus = `🟢 READY`;
      if (isRPMCooldown) {
        const secsLeft = Math.ceil((pairCooldowns.get(pairKey) - now) / 1000);
        modelStatus = `⚠️ 429 COOLDOWN (${secsLeft}s left)`;
      } else if (minCount >= m.rpm) {
        modelStatus = `⏳ RPM CAP REACHED (${minCount}/${m.rpm})`;
      } else if (dayCount >= m.rpd) {
        modelStatus = `🔴 RPD CAP REACHED (${dayCount}/${m.rpd})`;
      }

      console.log(`   - Model ${m.name.padEnd(22)} | Past 60s: ${minCount}/${m.rpm} RPM | Today: ${dayCount}/${m.rpd} RPD | ${modelStatus}`);
    });
  });
  console.log(`====================================================================\n`);
}

/**
 * Smart Rate-Balanced Content Generator
 */
export async function generateContentBalanced(providedKey, systemPrompt, userPrompt) {
  const apiKeys = loadApiKeys();
  const state = getUsageStats();
  const now = Date.now();
  const oneMinAgo = now - 60000;
  const startOfToday = new Date().setHours(0,0,0,0);

  const maxAttempts = apiKeys.length * MODEL_CONFIGS.length;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    // Pick next Key via round-robin
    const keyIndex = (globalKeyIndex++) % apiKeys.length;
    const currentKey = apiKeys[keyIndex];
    const keyHash = `key_${keyIndex}`;

    // Skip if key is marked daily exhausted
    if (keyDailyExhausted.has(keyIndex) && keyDailyExhausted.get(keyIndex) > now) {
      continue;
    }

    // Find an available, non-cooldown model for this key
    let selectedModel = null;
    for (const m of MODEL_CONFIGS) {
      const pairKey = `${keyIndex}_${m.name}`;

      // Check active 60s RPM cooldown
      if (pairCooldowns.has(pairKey) && pairCooldowns.get(pairKey) > now) {
        continue;
      }

      const minCount = state.history.filter(h => h.key === keyHash && h.model === m.name && h.time > oneMinAgo).length;
      const dayCount = state.history.filter(h => h.key === keyHash && h.model === m.name && h.time > startOfToday).length;

      if (minCount < m.rpm && dayCount < m.rpd) {
        selectedModel = m.name;
        break;
      }
    }

    if (!selectedModel) {
      continue;
    }

    console.log(`🤖 [Balancer] Call #${attempts}: Using Key [${keyIndex + 1}/${apiKeys.length}] with Model: ${selectedModel}`);

    const genAI = new GoogleGenerativeAI(currentKey);
    const modelInstance = genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction: systemPrompt,
      tools: [{ googleSearch: {} }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    });

    try {
      const result = await modelInstance.generateContent(userPrompt);
      saveHistory(state, keyHash, selectedModel);
      return {
        text: result.response.text(),
        usage: {
          prompt_tokens: result.response.usageMetadata?.promptTokenCount ?? 0,
          completion_tokens: result.response.usageMetadata?.candidatesTokenCount ?? 0,
          total_tokens: result.response.usageMetadata?.totalTokenCount ?? 0,
          cached_tokens: result.response.usageMetadata?.cachedContentTokenCount ?? 0
        },
        modelUsed: selectedModel,
        keyUsedIndex: keyIndex + 1
      };
    } catch (err) {
      const errMsg = (err.message || '').toLowerCase();
      const pairKey = `${keyIndex}_${selectedModel}`;

      if (errMsg.includes('quota exceeded') || errMsg.includes('resource_exhausted') || errMsg.includes('daily limit')) {
        console.warn(`🔴 [Balancer] Key ${keyIndex + 1} hit DAILY QUOTA EXHAUSTION! Pausing Key ${keyIndex + 1} for 24h.`);
        keyDailyExhausted.set(keyIndex, now + 86400000);
      } else if (errMsg.includes('429') || errMsg.includes('rate') || errMsg.includes('limit')) {
        console.warn(`⚠️  [Balancer] Key ${keyIndex + 1} + Model ${selectedModel} hit 429 RPM limit. Locking pair for 60s and switching to next healthy pair...`);
        pairCooldowns.set(pairKey, now + 60000);
      } else {
        throw err;
      }
    }
  }

  console.warn(`⏳ [Balancer] All Key + Model slots busy. Backing off for 3 seconds...`);
  await new Promise(r => setTimeout(r, 3000));
  return generateContentBalanced(providedKey, systemPrompt, userPrompt);
}
