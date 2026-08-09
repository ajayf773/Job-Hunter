#!/usr/bin/env node

/**
 * generate-excel-export.mjs
 * 
 * Exports all top-scoring jobs into an Excel-ready CSV/TSV spreadsheet.
 * Strictly enforces Portal-First applying (Primary Action = Apply via Official Portal URL),
 * and lists Cold Email ONLY IF an explicit contact email was provided directly on the JD page.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const trackerPath = join(ROOT, 'data', 'applications.md');
const coldEmailsDir = join(ROOT, 'output', 'cold-emails');
const resumesDir = join(ROOT, 'output', 'tailored-resumes');
const outputDir = join(ROOT, 'output');

const trackerContent = readFileSync(trackerPath, 'utf8');
const coldEmailFiles = existsSync(coldEmailsDir) ? readdirSync(coldEmailsDir).filter(f => f.endsWith('.md')) : [];
const pdfFiles = existsSync(resumesDir) ? readdirSync(resumesDir).filter(f => f.endsWith('.pdf')) : [];

function cleanFilename(str) {
  return str.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, ' ').trim();
}

function escapeCsv(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

const lines = trackerContent.split('\n');
const jobsData = [];

for (const line of lines) {
  if (!line.startsWith('|')) continue;
  const cols = line.split('|').map(c => c.trim());
  if (cols.length < 9) continue;

  const id = cols[1];
  const date = cols[2];
  const company = cols[3];
  const role = cols[4];
  const scoreStr = cols[5];
  const status = cols[6];
  const reportCol = cols[8];
  const notes = cols[9] || '';

  const scoreMatch = scoreStr.match(/(\d\.\d)\/5/);
  if (!scoreMatch) continue;
  
  const score = parseFloat(scoreMatch[1]);
  if (score >= 4.0) {
    const reportMatch = reportCol.match(/\(([^)]+)\)/);
    let reportPathStr = reportMatch ? reportMatch[1] : '';

    const safeCompany = cleanFilename(company);
    const coldEmailFile = coldEmailFiles.find(f => f.toLowerCase().includes(safeCompany.toLowerCase()));
    
    let explicitEmail = "";
    let primaryAction = "Apply via Official Portal";
    let applicationUrl = "";

    if (coldEmailFile) {
      const coldContent = readFileSync(join(coldEmailsDir, coldEmailFile), 'utf8');
      
      const emailMatch = coldContent.match(/\*\*TO[^*]*\*\*:\s*`([^`]+)`/);
      if (emailMatch && !emailMatch[1].includes('tech-lead') && (coldContent.includes('Explicit Email Found') || !emailMatch[1].includes('@company.com'))) {
        explicitEmail = emailMatch[1];
        primaryAction = "Send Cold Email (Explicit Contact Provided)";
      }
    }

    const matchedPdf = pdfFiles.find(p => p.toLowerCase().includes(safeCompany.toLowerCase())) || '';

    let location = "Remote / International";
    let salary = "Market Competitive";
    let jobBoard = "Official Career Portal";

    if (reportPathStr) {
      try {
        const absReportPath = resolve(join(ROOT, 'data'), reportPathStr);
        if (existsSync(absReportPath)) {
          const reportText = readFileSync(absReportPath, 'utf8');
          const locMatch = reportText.match(/\*\*Location:\*\*\s*([^\n]+)/i);
          if (locMatch) location = locMatch[1].trim();

          const salMatch = reportText.match(/\*\*(?:Advertised Comp|Salary|Compensation):\*\*\s*([^\n]+)/i);
          if (salMatch) salary = salMatch[1].trim();

          const urlMatch = reportText.match(/\*\*(?:URL|Link|Source):\*\*\s*([^\n]+)/i);
          if (urlMatch) applicationUrl = urlMatch[1].trim();

          if (applicationUrl.includes('naukri.com')) jobBoard = "Naukri (India)";
          else if (applicationUrl.includes('jobstreet')) jobBoard = "Jobstreet (Indonesia)";
          else if (applicationUrl.includes('glints.com')) jobBoard = "Glints (SE Asia)";
          else if (applicationUrl.includes('kalibrr')) jobBoard = "Kalibrr (Indonesia)";
          else if (applicationUrl.includes('linkedin.com')) jobBoard = "LinkedIn Jobs";
          else if (applicationUrl.includes('greenhouse.io')) jobBoard = "Greenhouse ATS";
          else if (applicationUrl.includes('ashbyhq.com')) jobBoard = "Ashby ATS";
          else if (applicationUrl.includes('lever.co')) jobBoard = "Lever ATS";
          else if (applicationUrl.includes('workday.com')) jobBoard = "Workday ATS";
        }
      } catch {}
    }

    jobsData.push({
      id,
      date,
      company,
      role,
      score,
      status,
      jobBoard,
      primaryAction,
      applicationUrl,
      explicitEmail,
      location,
      salary,
      resumePdf: matchedPdf ? `output/tailored-resumes/${matchedPdf}` : '',
      reportLink: reportPathStr,
      notes
    });
  }
}

jobsData.sort((a, b) => b.score - a.score);

console.log(`📊 Exporting ${jobsData.length} top jobs (Portal-First Policy) to Excel CSV/TSV...`);

const headers = [
  "ID", "Date Evaluated", "Company", "Role", "Match Score", "Status",
  "Job Board Source", "Primary Application Action", "Portal Application URL",
  "Explicit Contact Email (If Provided on JD)", "Location", "Salary / Compensation",
  "Tailored FlowCV Resume PDF", "Report Path", "Notes"
];

let csvContent = headers.map(escapeCsv).join(',') + '\n';
let tsvContent = headers.join('\t') + '\n';

jobsData.forEach(j => {
  const row = [
    j.id, j.date, j.company, j.role, j.score, j.status,
    j.jobBoard, j.primaryAction, j.applicationUrl, j.explicitEmail,
    j.location, j.salary, j.resumePdf, j.reportLink, j.notes
  ];

  csvContent += row.map(escapeCsv).join(',') + '\n';
  tsvContent += row.map(r => String(r || '').replace(/\t/g, ' ')).join('\t') + '\n';
});

const csvPath = join(outputDir, 'Top_Jobs_Analysis.csv');
const tsvPath = join(outputDir, 'Top_Jobs_Analysis.tsv');

writeFileSync(csvPath, csvContent, 'utf8');
writeFileSync(tsvPath, tsvContent, 'utf8');

console.log(`✅ CSV updated: output/Top_Jobs_Analysis.csv`);
console.log(`✅ TSV updated: output/Top_Jobs_Analysis.tsv`);
