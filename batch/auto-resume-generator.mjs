#!/usr/bin/env node

/**
 * auto-resume-generator.mjs
 * Production-ready, code-driven ATS resume generator.
 * 
 * Recreates FlowCV 2-column theme in Typst deterministically:
 * - Uses Gemini to produce clean JSON tailored data (no Typst syntax bugs)
 * - Code generates the .typ file deterministically
 * - Enforces zero hyphenation (#set text(hyphenate: false))
 * - Enforces strict 1-page compact layout rules
 * - Generates clean filenames: "Resume - {Company} - {Role} ({ID}).pdf"
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { generateContentBalanced } from '../gemini-model-balancer.mjs';

try {
  const { config } = await import('dotenv');
  config();
} catch {}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const cvPath = join(ROOT, 'cv.md');
const templateModulePath = join(ROOT, 'templates', 'flowcv-theme', 'template.typ');
const trackerPath = join(ROOT, 'data', 'applications.md');
const outputDir = join(ROOT, 'output', 'tailored-resumes');
const typstBin = join(ROOT, 'bin', 'typst');
const fontPath = join(ROOT, 'templates', 'attractive-typst-resume', 'assets', 'fonts');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

// Copy template.typ into output directory so Typst imports work smoothly
copyFileSync(templateModulePath, join(outputDir, 'template.typ'));

const cvContent = readFileSync(cvPath, 'utf8');
const trackerContent = readFileSync(trackerPath, 'utf8');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ No GEMINI_API_KEY found in environment or .env");
  process.exit(1);
}

function cleanFilename(str) {
  return str.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, ' ').trim();
}

function escapeTypst(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_');
}

function formatTypstCode(data) {
  if (!data.name || !data.email || !data.phone) {
    throw new Error("LLM response missing required PII fields (name, email, or phone).");
  }
  const name = escapeTypst(data.name);
  const title = escapeTypst(data.title || "Target Role");
  const email = escapeTypst(data.email);
  const phone = escapeTypst(data.phone);
  const location = escapeTypst(data.location || "Location");
  const github = escapeTypst(data.github || "");
  const summary = escapeTypst(data.summary || "");

  // Render Experience
  const expBlocks = (data.experience || []).map(item => {
    const roleTitle = escapeTypst(item.role);
    const companyName = escapeTypst(item.company);
    const loc = escapeTypst(item.location);
    const dates = escapeTypst(item.dates);
    const bullets = (item.bullets || []).map(b => `          - ${escapeTypst(b)}`).join('\n');

    return `        #block(below: 0.7em)[
          #text(weight: "bold")[${roleTitle}] \\
          #text(style: "italic")[${companyName}${loc ? ' | ' + loc : ''}] #h(1fr) #text(fill: rgb("#D78408"))[${dates}]
${bullets}
        ]`;
  }).join('\n');

  // Render Projects
  const projBlocks = (data.projects || []).map(item => {
    const projName = escapeTypst(item.name);
    const dates = escapeTypst(item.dates || "2024 – Present");
    const bullets = (item.bullets || []).map(b => `          - ${escapeTypst(b)}`).join('\n');

    return `        #block(below: 0.7em)[
          #text(weight: "bold")[${projName}] #h(1fr) #text(fill: rgb("#D78408"))[${dates}]
${bullets}
        ]`;
  }).join('\n');

  // Render Skills
  const domainSkills = (data.skills?.domain || []).map(s => `        - ${escapeTypst(s)}`).join('\n');
  const toolSkills = (data.skills?.tools || []).map(s => `        - ${escapeTypst(s)}`).join('\n');
  const aiSkills = (data.skills?.ai || []).map(s => `        - ${escapeTypst(s)}`).join('\n');

  return `#import "template.typ": *

#show: project.with(
  name: "${name}",
  title: "${title}",
  email: "${email}",
  phone: "${phone}",
  location: "${location}",
  github: "${github}",
  main: (
    (
      title: "Professional Summary",
      content: [
        ${summary}
      ]
    ),
    (
      title: "Experience",
      content: [
${expBlocks}
      ]
    ),
    (
      title: "Projects",
      content: [
${projBlocks}
      ]
    )
  ),
  sidebar: (
    (
      title: "Education",
      content: [
${(data.education || []).map(e => `        #text(weight: "bold")[${escapeTypst(e.degree)}] \\\\\n        ${escapeTypst(e.institution)} \\\\\n        ${escapeTypst(e.dates)}`).join('\n\n')}
      ]
    ),
    (
      title: "Technical Skills",
      content: [
        #text(weight: "bold")[Domain & Business Logic]
${domainSkills}
        
        #v(3pt)
        #text(weight: "bold")[Tools & Infrastructure]
${toolSkills}
        
        #v(3pt)
        #text(weight: "bold")[AI & Automation]
${aiSkills}
      ]
    ),
    (
      title: "Languages",
      content: [
        English (TOEFL: 7.5) | Tamil
      ]
    )
  )
)
`;
}

async function main() {
  const lines = trackerContent.split('\n');
  const targetJobs = [];

  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    
    const cols = line.split('|').map(c => c.trim());
    if (cols.length < 9) continue;

    const id = cols[1];
    const company = cols[3];
    const role = cols[4];
    const scoreStr = cols[5];
    const reportCol = cols[8];

    const scoreMatch = scoreStr.match(/(\d\.\d)\/5/);
    if (!scoreMatch) continue;
    
    const score = parseFloat(scoreMatch[1]);
    if (score >= 4.0) {
      const reportMatch = reportCol.match(/\(([^)]+)\)/);
      let reportPathStr = reportMatch ? reportMatch[1] : null;
      if (reportPathStr) {
        const absReportPath = resolve(join(ROOT, 'data'), reportPathStr);
        targetJobs.push({ id, company, role, score, reportPath: absReportPath });
      }
    }
  }

  console.log(`🚀 Production Run: Found ${targetJobs.length} top-match jobs (score >= 4.0)`);

  for (let i = 0; i < targetJobs.length; i++) {
    const job = targetJobs[i];
    
    const safeCompany = cleanFilename(job.company);
    const safeRole = cleanFilename(job.role);
    const filenameBase = `Resume - ${safeCompany} - ${safeRole} (${job.id})`;
    
    const outTypst = join(outputDir, `${filenameBase}.typ`);
    const outPdf = join(outputDir, `${filenameBase}.pdf`);

    console.log(`\n[${i+1}/${targetJobs.length}] Processing: ${filenameBase} [Score: ${job.score}]`);

    if (existsSync(outPdf)) {
      console.log(`  -> ⏭️ PDF already exists, skipping.`);
      continue;
    }

    let reportContent = "";
    try {
      reportContent = readFileSync(job.reportPath, 'utf8');
    } catch(e) {
      console.error(`  -> ❌ Failed to read report: ${job.reportPath}`);
      continue;
    }

    const systemPrompt = `You are an expert ATS resume tailoring engine. You output ONLY valid JSON.`;

    const userPrompt = `Target Job: ${job.company} - ${job.role}

Analyze my base resume and the target job report. Generate a JSON object tailored for this job.

JSON SCHEMA REQUIREMENT:
{
  "name": "AJAY MARIMUTHU",
  "title": "Tailored Headline (e.g. AI Engineer / Integration & Automation)",
  "email": "ajay9f01@gmail.com",
  "phone": "+91-7010409697",
  "location": "Chennai, India",
  "github": "github.com/ajayf773",
  "summary": "Tailored 3-4 sentence professional summary aligned with the job report.",
  "experience": [
    {
      "role": "Senior Research Analyst – Automotive Product Data",
      "company": "Merit Data & Technology Pvt. Ltd.",
      "location": "Chennai",
      "dates": "03/2022 – 06/2026",
      "bullets": [ "3-4 tailored bullet points emphasizing Python, data validation, and relevant domain concepts" ]
    },
    {
      "role": "Graduate Engineer Trainee",
      "company": "SKH Sheet Metal Components Pvt. Ltd.",
      "location": "Chennai",
      "dates": "11/2020 – 11/2021",
      "bullets": [ "1 short bullet point on manufacturing workflow monitoring" ]
    }
  ],
  "projects": [
    {
      "name": "AI-Powered Vehicle Specification ETL Pipeline",
      "dates": "2024 – Present",
      "bullets": [ "3 tailored bullet points emphasizing Python ETL, LLMs, REST APIs, and 35h to 15m optimization" ]
    }
  ],
  "education": [
    {
      "degree": "B.Tech - Mechanical Engineering",
      "institution": "University Name",
      "dates": "Graduated: 2020"
    }
  ],
  "skills": {
    "domain": [ "Vehicle Specification Analysis", "EV & Hybrid Fundamentals", "Data Validation", "Trim-Level Differentiation", "Competitive Benchmarking" ],
    "tools": [ "Python (Automation & ETL)", "SQL", "REST APIs", "Power BI & SAP", "Advanced Excel" ],
    "ai": [ "LLMs", "Local LLMs & RAG", "Vertex AI Gemini", "Generative AI Automation", "ETL Pipelines", "Workflow Automation" ]
  }
}

INSTRUCTIONS:
1. Ensure 'skills' includes all relevant implicit skills and extracted keywords from the evaluation report to guarantee clearing ATS filters.
2. Keep bullets crisp so the entire resume easily fits on 1 single page.
3. Return ONLY raw valid JSON. Do NOT wrap in markdown codeblocks.

--- BASE RESUME ---
${cvContent}

--- EVALUATION REPORT ---
${reportContent}
`;

    try {
      const result = await generateContentBalanced(apiKey, systemPrompt, userPrompt);
      let rawJson = result.text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();

      const parsedData = JSON.parse(rawJson);
      const typstCode = formatTypstCode(parsedData);

      writeFileSync(outTypst, typstCode, 'utf8');
      console.log(`  -> Saved code-driven source: ${filenameBase}.typ`);

      execFileSync(typstBin, [
        'compile',
        '--font-path', fontPath,
        outTypst,
        outPdf
      ], { cwd: outputDir, stdio: 'pipe' });
      
      console.log(`  -> ✅ Successfully compiled: ${filenameBase}.pdf`);
    } catch (err) {
      console.error(`  -> ❌ Error:`, err.message);
    }
  }
  
  console.log("\n🎉 Production deployment complete! All ATS resumes generated in output/tailored-resumes/");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
