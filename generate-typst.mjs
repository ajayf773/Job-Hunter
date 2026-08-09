#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';

try {
  const { config } = await import('dotenv');
  config();
} catch {}

const ROOT = dirname(fileURLToPath(import.meta.url));

const cvPath = join(ROOT, 'cv.md');
const templatePath = join(ROOT, 'templates', 'attractive-typst-resume', 'resume.typ');
const outputPath = join(ROOT, 'templates', 'attractive-typst-resume', 'resume-tailored.typ');
const finalPdfPath = join(ROOT, 'output', 'resume.pdf');

const cvContent = readFileSync(cvPath, 'utf8');
let templateContent;
try {
  templateContent = readFileSync(templatePath, 'utf8');
} catch (e) {
  console.error("Template not found. Did you clone it?");
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No GEMINI_API_KEY found in environment or .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

const prompt = `You are an expert resume formatter.
I have a Typst resume template and my resume data in markdown.
Your task is to rewrite the Typst template to include my data from the markdown file.
Keep the exact same styling, colors, and layout structure of the original template, but replace all the placeholder/dummy text with the actual information from my markdown resume.
Make sure to escape special characters correctly in Typst syntax if needed.
Important: Return ONLY the raw typst code. Do not wrap it in \`\`\`typst or \`\`\` codeblocks. Just the raw text starting with #import.

--- MY RESUME (MARKDOWN) ---
${cvContent}

--- TYPST TEMPLATE ---
${templateContent}
`;

console.log("Generating tailored Typst resume with Gemini...");

try {
  const result = await model.generateContent(prompt);
  let outputTypst = result.response.text();

  // Clean markdown backticks if present
  outputTypst = outputTypst.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');

  writeFileSync(outputPath, outputTypst, 'utf8');
  console.log("Saved tailored typst to " + outputPath);

  console.log("Compiling PDF with typst...");
  execFileSync(join(ROOT, 'bin', 'typst'), [
    'compile',
    '--font-path', join(ROOT, 'templates', 'attractive-typst-resume', 'assets', 'fonts'),
    outputPath,
    finalPdfPath
  ], { cwd: join(ROOT, 'templates', 'attractive-typst-resume'), stdio: 'inherit' });
  
  console.log("✅ Success! Resume PDF saved to " + finalPdfPath);
} catch (err) {
  console.error("Failed to generate or compile:", err.message);
  process.exit(1);
}
