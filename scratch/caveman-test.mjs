import { config } from 'dotenv';
config();
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const mainModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

// CAVEMAN Stopwords (the fluff words)
const stopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
  'to', 'in', 'on', 'with', 'by', 'for', 'of', 'that', 'this', 'it', 
  'its', 'as', 'at', 'be', 'from', 'which', 'has', 'have', 'had', 'been'
]);

function cavemanCompressText(text) {
  // Collapse whitespace
  let compressed = text.replace(/\s+/g, ' ');
  // Remove non-essential punctuation (keep periods, commas, numbers)
  compressed = compressed.replace(/[";:'()]/g, '');
  
  // Caveman loop: Drop stop words
  compressed = compressed.split(' ')
    .filter(word => !stopwords.has(word.toLowerCase()))
    .join(' ');
    
  return compressed.trim();
}

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
    return Math.floor(text.length / 4);
  }
}

async function runTest() {
  console.log("🚀 Starting Caveman Heuristic Pipeline Test...\n");

  console.log("1️⃣  Fetching external data (Wikipedia: Tesla, Inc.)...");
  const res = await fetch('https://en.wikipedia.org/wiki/Tesla,_Inc.');
  const rawHtml = await res.text();
  
  console.log("2️⃣  Running Cheerio Stripping...");
  const $ = cheerio.load(rawHtml);
  $('nav, header, footer, script, style, iframe, svg, .vector-menu, .mw-footer, .reference, .thumb, .infobox').remove();
  const rawText = $('#bodyContent').text().replace(/\s+/g, ' ').trim();
  
  // We truncate to a reasonable size so we don't blow up the API during the test
  const testRawText = rawText.substring(0, 30000);
  const rawTextTokens = await countTokens(testRawText, mainModel);
  console.log(`❌ CHEERIO PLAIN TEXT TOKENS (truncated block): ~${rawTextTokens.toLocaleString()} tokens`);

  console.log("3️⃣  Running CAVEMAN Heuristic Compression...");
  const cavemanText = cavemanCompressText(testRawText);
  const cavemanTokens = await countTokens(cavemanText, mainModel);
  console.log(`✅ CAVEMAN TEXT TOKENS: ~${cavemanTokens.toLocaleString()} tokens`);
  console.log(`📉 CAVEMAN TOKEN REDUCTION: ${Math.round((1 - (cavemanTokens / rawTextTokens)) * 100)}% reduction over plain text! (Without using any LLM)\n`);

  console.log("4️⃣  EVALUATION A: Plain Text Context (No Caveman)");
  const evalPromptA = `You are a career coach evaluating a job.
Job Description:
${dummyJD}

External Research:
${testRawText}

Is this a stable company to join based on the research? Answer in 2 sentences.`;
  
  const evalA = await mainModel.generateContent(evalPromptA);
  console.log(`Result A:\n${evalA.response.text()}\n`);

  console.log("5️⃣  EVALUATION B: Caveman Compressed Context");
  const evalPromptB = `You are a career coach evaluating a job.
Job Description:
${dummyJD}

External Research:
${cavemanText}

Is this a stable company to join based on the research? Answer in 2 sentences.`;
  
  const evalB = await mainModel.generateContent(evalPromptB);
  console.log(`Result B:\n${evalB.response.text()}`);
}

runTest().catch(console.error);
