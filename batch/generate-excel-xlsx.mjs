#!/usr/bin/env node

/**
 * generate-excel-xlsx.mjs
 * 
 * Generates a native Microsoft Excel (.xlsx) file at output/Top_Jobs_Analysis.xlsx
 * Features:
 *   1. Interactive Dropdown Data Validation for "Shortlist / Status" column (Evaluated, Shortlisted, Applied, Pass, Rejected).
 *   2. Styled Headers (FlowCV Theme: Dark #313131 background, Gold #FFDD50 text).
 *   3. Clickable Hyperlinks for Application URLs and Tailored Resume PDFs.
 *   4. Preserves user-selected dropdown choices across re-runs.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const trackerPath = join(ROOT, 'data', 'applications.md');
const coldEmailsDir = join(ROOT, 'output', 'cold-emails');
const resumesDir = join(ROOT, 'output', 'tailored-resumes');
const outputDir = join(ROOT, 'output');
const xlsxPath = join(outputDir, 'Top_Jobs_Analysis.xlsx');

const trackerContent = readFileSync(trackerPath, 'utf8');
const coldEmailFiles = existsSync(coldEmailsDir) ? readdirSync(coldEmailsDir).filter(f => f.endsWith('.md')) : [];
const pdfFiles = existsSync(resumesDir) ? readdirSync(resumesDir).filter(f => f.endsWith('.pdf')) : [];

function cleanFilename(str) {
  return str.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, ' ').trim();
}

// Preserve existing user selections if Top_Jobs_Analysis.xlsx exists
const existingStatuses = new Map();
if (existsSync(xlsxPath)) {
  try {
    const existingWorkbook = new ExcelJS.Workbook();
    await existingWorkbook.xlsx.readFile(xlsxPath);
    const existingSheet = existingWorkbook.getWorksheet('Top Jobs');
    if (existingSheet) {
      existingSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const id = row.getCell(1).value?.toString();
          const status = row.getCell(6).value?.toString();
          if (id && status) existingStatuses.set(id, status);
        }
      });
    }
  } catch (err) {
    console.log(`ℹ️ Creating fresh Excel workbook.`);
  }
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
  const defaultStatus = cols[6];
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

    // Status Precedence: Tracker status (Applied, Rejected, Pass, Skip) ALWAYS wins over old Excel dropdowns!
    let status = defaultStatus;
    const dsLower = defaultStatus.toLowerCase();
    if (['applied', 'rejected', 'pass', 'skip', 'discard'].includes(dsLower)) {
      status = defaultStatus;
    } else if (existingStatuses.has(id)) {
      status = existingStatuses.get(id);
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

console.log(`📊 Creating Native Microsoft Excel Workbook (.xlsx) for ${jobsData.length} top jobs...`);

const workbook = new ExcelJS.Workbook();
workbook.creator = 'job-hunter-ai Pipeline';
workbook.lastModifiedBy = 'Ajay Marimuthu';

const worksheet = workbook.addWorksheet('Top Jobs', {
  views: [{ state: 'frozen', ySplit: 1 }]
});

// Configure Columns
worksheet.columns = [
  { header: 'ID', key: 'id', width: 8 },
  { header: 'Date Evaluated', key: 'date', width: 14 },
  { header: 'Company', key: 'company', width: 20 },
  { header: 'Role', key: 'role', width: 32 },
  { header: 'Match Score', key: 'score', width: 12 },
  { header: 'Shortlist / Status 🔽', key: 'status', width: 18 },
  { header: 'Job Board Source', key: 'jobBoard', width: 22 },
  { header: 'Primary Action', key: 'primaryAction', width: 30 },
  { header: 'Portal Application Link 🔗', key: 'applicationUrl', width: 45 },
  { header: 'Explicit Contact Email', key: 'explicitEmail', width: 28 },
  { header: 'Location', key: 'location', width: 22 },
  { header: 'Salary / Compensation', key: 'salary', width: 22 },
  { header: 'Tailored FlowCV Resume PDF 📄', key: 'resumePdf', width: 45 },
  { header: 'Report Path', key: 'reportLink', width: 30 },
  { header: 'Notes', key: 'notes', width: 30 }
];

// Header Styling (FlowCV Dark #313131 background, Yellow #FFDD50 text)
const headerRow = worksheet.getRow(1);
headerRow.height = 28;
headerRow.eachCell((cell) => {
  cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFDD50' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF313131' } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = {
    top: { style: 'medium', color: { argb: 'FFD78408' } },
    bottom: { style: 'medium', color: { argb: 'FFD78408' } }
  };
});

// Add Data Rows
jobsData.forEach((j, index) => {
  const rowNumber = index + 2;
  const row = worksheet.addRow({
    id: j.id,
    date: j.date,
    company: j.company,
    role: j.role,
    score: j.score,
    status: j.status,
    jobBoard: j.jobBoard,
    primaryAction: j.primaryAction,
    applicationUrl: j.applicationUrl ? { text: 'Apply on Portal 🔗', hyperlink: j.applicationUrl } : 'N/A',
    explicitEmail: j.explicitEmail || 'N/A (Apply via Portal)',
    location: j.location,
    salary: j.salary,
    resumePdf: j.resumePdf ? { text: 'Open Resume PDF 📄', hyperlink: `file:///${ROOT}/${j.resumePdf}` } : 'N/A',
    reportLink: j.reportLink,
    notes: j.notes
  });

  // Highlight Score
  const scoreCell = row.getCell(5);
  scoreCell.font = { bold: true, color: { argb: j.score >= 4.5 ? 'FF007E33' : 'FF0099CC' } };
  scoreCell.alignment = { horizontal: 'center' };

  // Add Excel Data Validation Dropdown for "Shortlist / Status" Column
  const statusCell = row.getCell(6);
  statusCell.dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: ['"Evaluated,Shortlisted,Applied,Pass,Rejected"'],
    showErrorMessage: true,
    errorTitle: 'Invalid Selection',
    error: 'Please choose Evaluated, Shortlisted, Applied, Pass, or Rejected.'
  };
  statusCell.font = { bold: true };
  statusCell.alignment = { horizontal: 'center' };

  // Highlight Shortlisted
  if (j.status.toLowerCase().includes('shortlist')) {
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };
  }

  // Hyperlink styling
  const urlCell = row.getCell(9);
  if (j.applicationUrl) {
    urlCell.font = { color: { argb: 'FF0D47A1' }, underline: true };
  }

  const pdfCell = row.getCell(13);
  if (j.resumePdf) {
    pdfCell.font = { color: { argb: 'FF0D47A1' }, underline: true };
  }
});

await workbook.xlsx.writeFile(xlsxPath);
console.log(`🎉 Native Microsoft Excel file generated successfully: output/Top_Jobs_Analysis.xlsx`);

// Write CSV export for auto-apply script consumption
const csvPath = join(outputDir, 'Top_Jobs_Analysis.csv');
const csvHeaders = ['ID', 'Date', 'Company', 'Role', 'Score', 'Status', 'Job Board', 'Primary Action', 'Application URL', 'Explicit Email', 'Location', 'Salary', 'Tailored Resume PDF', 'Report Link', 'Notes'];
const csvLines = [csvHeaders.join(',')];
jobsData.forEach(j => {
  csvLines.push([
    `"${j.id}"`, `"${j.date}"`, `"${j.company}"`, `"${j.role}"`, `"${j.score}"`, `"${j.status}"`,
    `"${j.jobBoard}"`, `"${j.primaryAction}"`, `"${j.applicationUrl}"`, `"${j.explicitEmail}"`,
    `"${j.location}"`, `"${j.salary}"`, `"${j.resumePdf}"`, `"${j.reportLink}"`, `"${j.notes.replace(/"/g, '""')}"`
  ].join(','));
});
writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
console.log(`✅ CSV updated: output/Top_Jobs_Analysis.csv`);
