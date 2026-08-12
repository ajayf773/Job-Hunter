import { config } from 'dotenv';
config();
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use valid models: 3.6-flash is standard, 3.5-flash-lite for fast summarization (as per gemini-eval.mjs notes)
const flashLite = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
const mainModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

const dummyJD = `
AI Engineer - Autonomous Driving
Company: Tesla, Inc.
Location: Palo Alto, CA (On-site)
We are looking for a mid-level AI Engineer to build scalable semantic pipelines.
Requirements: Python, C++, LLMs, 4+ years experience.
`;

async function countTokens(text, model) {
  try {
    const res = await model.countTokens(text);
    return res.totalTokens;
  } catch (e) {
    return text.length / 4; // fallback estimate
  }
}

async function runTest() {
  console.log("🚀 Starting Enrichment Pipeline Test...\n");

  console.log("1️⃣  Fetching external data (Wikipedia: Tesla, Inc.)...");
  const res = await fetch('https://en.wikipedia.org/wiki/Tesla,_Inc.');
  const rawHtml = await res.text();
  
  const rawTokens = await countTokens(rawHtml, flashLite);
  console.log(`❌ RAW HTML TOKENS: ~${rawTokens.toLocaleString()} tokens`);

  console.log("\n2️⃣  Running Data Sanitization (Cheerio + Turndown)...");
  const $ = cheerio.load(rawHtml);
  // Strip junk
  $('nav, header, footer, script, style, iframe, svg, .vector-menu, .mw-footer').remove();
  const mainContent = $('#bodyContent').html() || $('body').html();
  
  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(mainContent);
  const mdTokens = await countTokens(markdown, flashLite);
  console.log(`✅ SANITIZED MARKDOWN TOKENS: ~${mdTokens.toLocaleString()} tokens`);

  console.log("\n3️⃣  Running LLM Pre-filter (Gemini Flash-Lite)...");
  const summarizePrompt = `
  Analyze the following company data and extract exactly 3 bullets:
  1. Financial stability/Scale
  2. Recent controversies/layoffs
  3. Core engineering focus
  
  Data:
  ${markdown.substring(0, 100000)} // truncate just in case
  `;
  
  const summaryRes = await flashLite.generateContent(summarizePrompt);
  const summaryText = summaryRes.response.text();
  
  const enrichedContext = `
<enriched_data>
Company Insights:
${summaryText.trim()}
</enriched_data>
`;
  const finalTokens = await countTokens(enrichedContext, mainModel);
  console.log(`✅ FINAL ENRICHED CONTEXT TOKENS: ~${finalTokens.toLocaleString()} tokens`);
  console.log(`📉 TOTAL TOKEN REDUCTION: ${Math.round((1 - (finalTokens / rawTokens)) * 100)}% reduction!`);
  
  console.log("\n4️⃣  EVALUATION A: Without External Data (JD Only)");
  const evalPromptA = `You are a career coach evaluating a job.
  Job Description:
  ${dummyJD}
  
  Is this a stable company to join? Answer in 2 sentences.`;
  
  const evalA = await mainModel.generateContent(evalPromptA);
  console.log(`Result A:\n${evalA.response.text()}`);

  console.log("\n5️⃣  EVALUATION B: With Token-Optimized Enrichment");
  const evalPromptB = `You are a career coach evaluating a job.
  Job Description:
  ${dummyJD}
  
  External Research:
  ${enrichedContext}
  
  Is this a stable company to join based on the external research? Answer in 2 sentences.`;
  
  const evalB = await mainModel.generateContent(evalPromptB);
  console.log(`Result B:\n${evalB.response.text()}`);
  
}

runTest().catch(console.error);
