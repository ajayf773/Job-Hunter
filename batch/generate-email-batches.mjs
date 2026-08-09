#!/usr/bin/env node

/**
 * generate-email-batches.mjs
 * 
 * STRICT EMAIL POLICY (USER RULE):
 * Primary channel is APPLYING VIA PORTAL.
 * Cold email drafts are generated ONLY IF an explicit contact email is provided
 * directly on the job posting page. Guessed/generic placeholders are EXCLUDED.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coldEmailsDir = join(ROOT, 'output', 'cold-emails');
const resumesDir = join(ROOT, 'output', 'tailored-resumes');
const outputDir = join(ROOT, 'output', 'ready-to-send-emails');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const files = readdirSync(coldEmailsDir).filter(f => f.endsWith('.md'));
const pdfFiles = readdirSync(resumesDir).filter(f => f.endsWith('.pdf'));

console.log(`🚀 Processing cold email strategy reports for explicit emails only...`);

const emailRecords = [];

for (const file of files) {
  const filePath = join(coldEmailsDir, file);
  const content = readFileSync(filePath, 'utf8');

  // Extract Company Name
  const companyMatch = file.match(/ColdEmail - ([^.]+)\.md/);
  const company = companyMatch ? companyMatch[1] : "Company";

  // Check if an EXPLICIT email address was provided on the job posting page
  const toMatch = content.match(/\*\*TO[^*]*\*\*:\s*`([^`]+)`/);
  const toEmail = toMatch ? toMatch[1].trim() : "";

  // Filter out guessed/generic placeholders
  const isGeneric = !toEmail || toEmail.includes('tech-lead') || toEmail.includes('recruiting@') && !content.includes('Explicit Email Found');

  if (isGeneric && !content.includes('Explicit Email Found')) {
    // Skip creating cold email dispatch for roles without explicit contact email
    continue;
  }

  // Extract CC
  const ccMatch = content.match(/\*\*CC[^*]*\*\*:\s*`([^`]+)`/);
  const ccEmail = ccMatch ? ccMatch[1].trim() : "";

  // Extract Subject
  const subjectMatch = content.match(/\*\*Subject:\*\*\s*(.+)/);
  const subject = subjectMatch ? subjectMatch[1].trim() : `Application / Ajay Marimuthu`;

  // Extract Body
  let body = "";
  const bodyMatch = content.match(/## 4\. Master Cold Email Draft[\s\S]*?> ([\s\S]*?)(?:\n---|\n##|$)/);
  if (bodyMatch) {
    body = bodyMatch[1].replace(/^> /gm, '').trim();
  }

  const matchedPdf = pdfFiles.find(p => p.toLowerCase().includes(company.toLowerCase())) || "output/resume.pdf";
  const pdfPath = join('output', 'tailored-resumes', matchedPdf);

  emailRecords.push({
    company,
    toEmail,
    ccEmail,
    subject,
    body,
    attachment: pdfPath,
    reportFile: file
  });
}

console.log(`📦 Found ${emailRecords.length} companies with explicit contact emails.`);

if (emailRecords.length > 0) {
  const BATCH_SIZE = 20;
  const totalBatches = Math.ceil(emailRecords.length / BATCH_SIZE);

  for (let b = 0; b < totalBatches; b++) {
    const batchRecords = emailRecords.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const batchNumber = b + 1;
    const outFile = join(outputDir, `Batch-${batchNumber}-Outreach.md`);

    let mdContent = `# Cold Email Dispatch: Batch ${batchNumber} of ${totalBatches}\n`;
    mdContent += `> **Policy**: Sent ONLY to explicit contact emails provided on the job posting.\n\n`;
    mdContent += `--- \n\n`;

    batchRecords.forEach((rec, idx) => {
      const globalIdx = b * BATCH_SIZE + idx + 1;
      mdContent += `### Email #${globalIdx}: ${rec.company}\n`;
      mdContent += `- **TO**: \`${rec.toEmail}\`\n`;
      if (rec.ccEmail) mdContent += `- **CC**: \`${rec.ccEmail}\`\n`;
      mdContent += `- **Subject**: \`${rec.subject}\`\n`;
      mdContent += `- **Attachment**: \`${rec.attachment}\`\n\n`;
      mdContent += `\`\`\`text\n${rec.body}\n\`\`\`\n\n`;
      mdContent += `---\n\n`;
    });

    writeFileSync(outFile, mdContent, 'utf8');
    console.log(`  -> ✅ Saved Batch ${batchNumber} (${batchRecords.length} emails) to output/ready-to-send-emails/Batch-${batchNumber}-Outreach.md`);
  }
} else {
  console.log(`ℹ️ No explicit emails found on job postings. Applications should be submitted via primary job portals.`);
}

// Write JSON manifest
writeFileSync(join(outputDir, 'dispatch-manifest.json'), JSON.stringify(emailRecords, null, 2), 'utf8');
