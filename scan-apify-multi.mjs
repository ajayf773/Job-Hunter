#!/usr/bin/env node

/**
 * scan-apify-multi.mjs
 * 
 * Master Multi-Account Apify Job Search Engine:
 *   1. LinkedIn (`curious_coder/linkedin-jobs-scraper`) — Posted within 7 days (Limit: 300)
 *   2. Indeed (`borderline/indeed-scraper`) — Posted within 7 days (Limit: 300)
 *   3. Naukri India (`memo23/naukri-scraper`) — Posted within 7 days (Limit: 300)
 *   4. Jobstreet SE Asia (`blackfalcondata/jobstreet-scraper`) (Limit: 300)
 * 
 * Includes Expanded Search Query Matrix & Strict Cross-Run Deduplication.
 * Reports all actor execution errors & API key quotas directly in CLI output.
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const configPath = join(ROOT, 'config', 'apify-tokens.json');
const pipelineFile = join(ROOT, 'data', 'pipeline.md');
const historyFile = join(ROOT, 'data', 'scan-history.tsv');
const appsFile = join(ROOT, 'data', 'applications.md');

let tokens = {
  linkedin: process.env.APIFY_TOKEN_LINKEDIN || "",
  indeed: process.env.APIFY_TOKEN_INDEED || "",
  naukri: process.env.APIFY_TOKEN_NAUKRI || "",
  indonesia: process.env.APIFY_TOKEN_INDONESIA || ""
};

if (existsSync(configPath)) {
  try {
    tokens = { ...tokens, ...JSON.parse(readFileSync(configPath, 'utf8')) };
  } catch {}
}

const seenUrls = new Set();
function loadSeenUrl(urlStr) {
  if (!urlStr) return;
  const cleaned = urlStr.trim().toLowerCase().split('?')[0];
  if (cleaned) seenUrls.add(cleaned);
}

if (existsSync(historyFile)) {
  const lines = readFileSync(historyFile, 'utf8').split('\n');
  lines.forEach(l => {
    const parts = l.split('\t');
    if (parts[1]) loadSeenUrl(parts[1]);
  });
}

if (existsSync(appsFile)) {
  const lines = readFileSync(appsFile, 'utf8').split('\n');
  lines.forEach(l => {
    const matches = l.match(/\((https?:\/\/[^)]+)\)/g);
    if (matches) matches.forEach(m => loadSeenUrl(m.slice(1, -1)));
  });
}

if (existsSync(pipelineFile)) {
  const lines = readFileSync(pipelineFile, 'utf8').split('\n');
  lines.forEach(l => {
    const urlMatch = l.match(/https?:\/\/[^\s#]+/);
    if (urlMatch) loadSeenUrl(urlMatch[0]);
  });
}

console.log(`🛡️ Deduplication Memory Loaded: ${seenUrls.size} previously processed URLs in database.`);
console.log(`==================================================`);
console.log(`🚀 Multi-Portal Apify High-Capacity Scraper Engine Started`);
console.log(`  - 🔵 LinkedIn Token: ${tokens.linkedin ? 'ACTIVE ✅' : 'NOT SET'}`);
console.log(`  - 🟡 Indeed Token:   ${tokens.indeed ? 'ACTIVE ✅' : 'NOT SET'}`);
console.log(`  - 🟢 Naukri Token:   ${tokens.naukri ? 'ACTIVE ✅' : 'NOT SET'}`);
console.log(`  - 🔴 Jobstreet Token: ${tokens.indonesia ? 'ACTIVE ✅' : 'NOT SET'}`);
console.log(`==================================================\n`);

async function runApifyActor(actorSlug, payload, token, portalName, extractFn) {
  if (!token || token.includes('_here')) {
    console.log(`⚠️ Skipping ${portalName}: Token not configured in config/apify-tokens.json`);
    return 0;
  }

  console.log(`🤖 Invoking ${portalName} Actor (${actorSlug}) with limit 300...`);
  try {
    const runRes = await fetch(`https://api.apify.com/v2/acts/${actorSlug}/runs?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const runData = await runRes.json();
    const runId = runData.data?.id;
    const datasetId = runData.data?.defaultDatasetId;

    if (!runId) {
      console.error(`❌ ${portalName} Apify Error: ${runData.error?.message || JSON.stringify(runData)}`);
      return 0;
    }

    console.log(`  -> ✅ ${portalName} Run Started! Run ID: ${runId}`);
    let completed = false;
    let attempts = 0;
    while (!completed && attempts < 50) {
      await new Promise(r => setTimeout(r, 4000));
      attempts++;
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
      const statusData = await statusRes.json();
      const status = statusData.data?.status;
      
      if (status === 'SUCCEEDED') {
        completed = true;
        console.log(`  -> 🎉 ${portalName} Run Succeeded! Downloading dataset...`);
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        console.error(`  -> ❌ ${portalName} Run failed with status: ${status} | Details: ${JSON.stringify(statusData.data?.statusMessage || '')}`);
        return 0;
      } else {
        process.stdout.write('.');
      }
    }

    if (datasetId) {
      const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`);
      const items = await itemsRes.json();
      console.log(`\n📦 Retrieved ${items.length} raw jobs from ${portalName}.`);

      let added = 0;
      let dupes = 0;

      items.forEach(item => {
        const { url, title, company } = extractFn(item);
        if (url) {
          const cleaned = url.trim().toLowerCase().split('?')[0];
          if (seenUrls.has(cleaned)) {
            dupes++;
          } else {
            seenUrls.add(cleaned);
            appendFileSync(pipelineFile, `\n${url} # ${company} - ${title}`, 'utf8');
            appendFileSync(historyFile, `${new Date().toISOString().split('T')[0]}\t${url}\tscraped\t${portalName}\n`, 'utf8');
            added++;
          }
        }
      });

      console.log(`  -> ✅ ${portalName}: Added ${added} new jobs, skipped ${dupes} duplicates.`);
      return added;
    }
  } catch (err) {
    console.error(`❌ ${portalName} Exception Error: ${err.message}`);
  }
  return 0;
}

// Search Query Targets
const searchQueries = ["AI Engineer", "Machine Learning Engineer", "Data Engineer", "LLM Engineer", "AI Automation Engineer"];

// 1. LinkedIn Scraper (Limit: 300)
const linkedinCount = await runApifyActor(
  'curious_coder~linkedin-jobs-scraper',
  {
    "urls": searchQueries.map(q => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}`),
    "datePosted": "past24Hours",
    "sortBy": "recent",
    "limitPerSource": 300,
    "scrapeCompany": true
  },
  tokens.linkedin,
  'LinkedIn',
  item => ({
    url: item.link || item.url || item.jobUrl,
    title: item.title || item.jobTitle || 'AI Engineer',
    company: item.companyName || item.company || 'LinkedIn Employer'
  })
);

// 2. Indeed Scraper (Limit: 300)
const indeedCount = await runApifyActor(
  'borderline~indeed-scraper',
  {
    "query": "AI Engineer OR Machine Learning Engineer OR Data Engineer",
    "country": "us",
    "maxRows": 300,
    "fromDays": "1",
    "sort": "date"
  },
  tokens.indeed,
  'Indeed',
  item => ({
    url: item.url || item.jobUrl || item.link,
    title: item.title || item.jobTitle || 'AI Engineer',
    company: item.company || item.companyName || 'Indeed Employer'
  })
);

// 3. Naukri India Scraper (Limit: 300)
const naukriCount = await runApifyActor(
  'memo23~naukri-scraper',
  {
    "platform": "naukri",
    "keyword": "AI Engineer",
    "location": "india",
    "maximumJobs": 300,
    "jobFreshness": 1,
    "sort": "date"
  },
  tokens.naukri,
  'Naukri (India)',
  item => ({
    url: item.jdURL || item.url || item.jobUrl,
    title: item.title || item.jobTitle || 'AI Engineer',
    company: item.companyName || item.company || 'Naukri Employer'
  })
);

// 4. Jobstreet SE Asia Scraper (Limit: 300)
const jobstreetCount = await runApifyActor(
  'blackfalcondata~jobstreet-scraper',
  {
    "searchTerm": "AI Engineer",
    "country": "ID",
    "maxResults": 300
  },
  tokens.indonesia,
  'Jobstreet (Indonesia)',
  item => ({
    url: item.url || item.jobUrl || item.link,
    title: item.title || item.jobTitle || 'AI Engineer',
    company: item.company || item.companyName || 'Jobstreet Employer'
  })
);

const totalAdded = linkedinCount + indeedCount + naukriCount + jobstreetCount;
console.log(`\n==================================================`);
console.log(`🎉 MULTI-PORTAL HIGH-CAPACITY APISCAN COMPLETE!`);
console.log(`   - Total Fresh Jobs Ingested to Pipeline: ${totalAdded}`);
console.log(`==================================================`);
