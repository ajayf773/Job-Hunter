#!/usr/bin/env node

/**
 * auto-cold-email-finder.mjs
 * 
 * Company-Deduplicated Executive Outreach & Cold Email Strategy:
 * 1. Groups top-match jobs (score >= 4.0) by Company.
 * 2. Selects the BEST role per company (highest score).
 * 3. Sets Primary TO: Lead Recruiter / Talent Lead.
 * 4. Sets CC: Engineering Manager / Tech Lead.
 * 5. Adds open-flexibility clause ("willing to consider any suitable role").
 * 6. Generates structured intelligence reports in output/cold-emails/
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { generateContentBalanced } from '../gemini-model-balancer.mjs';

try {
  const { config } = await import('dotenv');
  config();
} catch {}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const trackerPath = join(ROOT, 'data', 'applications.md');
const outputDir = join(ROOT, 'output', 'cold-emails');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ No GEMINI_API_KEY found.");
  process.exit(1);
}

const trackerContent = readFileSync(trackerPath, 'utf8');

function cleanFilename(str) {
  return str.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, ' ').trim();
}

async function main() {
  const lines = trackerContent.split('\n');
  const companyJobsMap = new Map();

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
        if (!companyJobsMap.has(company)) {
          companyJobsMap.set(company, []);
        }
        companyJobsMap.get(company).push({ id, company, role, score, reportPath: absReportPath });
      }
    }
  }

  // Deduplicate by company, selecting the best scoring role per company
  const companyTargets = [];
  for (const [company, jobs] of companyJobsMap.entries()) {
    jobs.sort((a, b) => b.score - a.score);
    const primaryJob = jobs[0];
    const altRoles = jobs.slice(1).map(j => j.role);
    companyTargets.push({ company, primaryJob, altRoles, allJobsCount: jobs.length });
  }

  console.log(`🚀 Company-Deduplicated Cold Email Engine: Processing ${companyTargets.length} unique companies...`);

  for (let i = 0; i < companyTargets.length; i++) {
    const target = companyTargets[i];
    const job = target.primaryJob;
    const safeCompany = cleanFilename(job.company);
    const filenameBase = `ColdEmail - ${safeCompany}`;
    const outFile = join(outputDir, `${filenameBase}.md`);

    console.log(`\n[${i+1}/${companyTargets.length}] ${target.company} — Primary Target Role: "${job.role}" (Score: ${job.score}/5, ${target.allJobsCount} total open roles evaluated)`);

    let reportContent = "";
    try {
      reportContent = readFileSync(job.reportPath, 'utf8');
    } catch(e) {
      console.error(`  -> ❌ Could not read report: ${job.reportPath}`);
      continue;
    }

    // Check if explicit email exists in report or job description
    const emailMatch = reportContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (!emailMatch || emailMatch[0].includes('example.com') || emailMatch[0].includes('ashbyhq.com') || emailMatch[0].includes('greenhouse.io')) {
      console.log(`  -> ⏭️ No explicit recruiter/company email found on posting. Skipping cold email strategy generation.`);
      continue;
    }

    const systemPrompt = `You are a world-class executive recruiter and cold outreach strategist. Output structured markdown.`;

    const userPrompt = `Company: ${job.company}
Primary Selected Role: ${job.role} (Score: ${job.score}/5)
Other Open Roles Evaluated at Company: ${target.altRoles.length > 0 ? target.altRoles.join(', ') : 'None'}

Job Evaluation Report:
${reportContent}

OUTREACH STRATEGY INSTRUCTIONS:
1. TARGETING & CC ROUTING:
   - Primary TO: Lead Recruiter / Head of Talent Acquisition (e.g. \`recruiting@${safeCompany.toLowerCase()}.com\` or \`firstname.lastname@${safeCompany.toLowerCase()}.com\`)
   - CC Addition: Engineering Manager / Tech Lead for the AI team (e.g. \`firstname.lastname@${safeCompany.toLowerCase()}.com\`)
2. FLEXIBILITY CLAUSE:
   - In the cold email draft, explicitly state that while the candidate is applying for ${job.role}, they are flexible and eager to be considered for any suitable AI, Data, or Engineering role on the team.
3. CONCISE & PUNCHY:
   - Keep email draft short (max 140 words). Highlight candidate's key metric (Python ETL, 35h -> 15m gain, LLMs, data validation).

STRUCTURE YOUR OUTPUT IN MARKDOWN:

# Cold Outreach Strategy: ${job.company}

## 1. Selected Position & Company Context
- **Primary Role**: ${job.role} (Score: ${job.score}/5)
${target.altRoles.length > 0 ? `- **Alternative Open Roles Mentioned**: ${target.altRoles.join(', ')}` : ''}

## 2. Recruiter & Hiring Manager Routing
| Field | Contact / Target Profile | Predicted Email Address | Confidence Score % |
| :--- | :--- | :--- | :--- |
| **TO (Primary)** | Lead Recruiter / Head of Talent | \`recruiting@${safeCompany.toLowerCase()}.com\` or \`firstname.lastname@${safeCompany.toLowerCase()}.com\` | 90% |
| **CC (Secondary)** | Engineering Manager / AI Lead | \`firstname.lastname@${safeCompany.toLowerCase()}.com\` | 85% |

## 3. Outreach Plausibility & Success Rating
- **Plausibility Rating**: High (85%)
- **Strategy**: Direct cold email to Talent Lead + CC Engineering Lead bypasses ATS queues and places technical proof points in front of decision-makers.

## 4. Master Cold Email Draft (Ready to Send)

**TO:** [Lead Recruiter Email]  
**CC:** [Engineering Lead Email]  
**Subject:** Application & Introduction: ${job.role} / Ajay Marimuthu  

> Hi [Recruiter Name] (cc: [Engineering Lead Name]),
> 
> I recently reviewed ${job.company}'s engineering initiatives and wanted to reach out directly regarding the **${job.role}** position.
> 
> I am an AI & Data Engineer specializing in Python automation, LLM workflows, and data pipelines. Recently, I architected an AI-powered ETL system that reduced processing times from 35 hours to 15 minutes while maintaining strict data validation standards.
> 
> While **${job.role}** is a strong fit for my background, I am equally open and excited to be considered for any suitable AI, Data, or Software Engineering opportunities across your teams.
> 
> I've attached my resume and would welcome a brief conversation to see where my skills best support ${job.company}'s goals.
> 
> Best regards,  
> **Ajay Marimuthu**  
> github.com/ajayf773 | ajay9f01@gmail.com | +91-7010409697
`;

    try {
      const result = await generateContentBalanced(apiKey, systemPrompt, userPrompt);
      writeFileSync(outFile, result.text, 'utf8');
      console.log(`  -> ✅ Strategy report saved to ColdEmail - ${safeCompany}.md`);
    } catch (err) {
      console.error(`  -> ❌ Error:`, err.message);
    }
  }

  console.log("\n🎉 Deduplicated Cold Email Strategy complete! Check output/cold-emails/");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
