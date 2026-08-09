#!/usr/bin/env python3
import os
import re
import csv
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
reports_dir = os.path.join(ROOT, 'reports')
apps_md_path = os.path.join(ROOT, 'data', 'applications.md')
csv_path = os.path.join(ROOT, 'output', 'Top_Jobs_Analysis.csv')
output_dir = os.path.join(ROOT, 'output', 'tailored-resumes')
os.makedirs(output_dir, exist_ok=True)

print("🎯 Building Exact FlowCV Resumes (PT Serif, 9pt, 16mm Margins, 1.2 Line Height)...")
print(f"📁 Output Directory: {output_dir}\n")

# Exact FlowCV HTML Template following User Settings & https://flowcv.com/resume/qldann9sweec
FLOWCV_EXACT_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 210mm;
    height: 297mm;
    margin: 0 auto;
    font-family: 'PT Serif', Georgia, serif;
    font-size: 9pt;
    line-height: 1.2;
    background-color: #ffffff;
    color: #000000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    overflow: hidden;
  }
  .resume-page {
    display: flex;
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    background-color: #ffffff;
  }
  
  /* LEFT COLUMN (40% Width - Dark Slate Theme) */
  .left-col {
    width: 40%;
    max-width: 40%;
    background-color: rgb(49, 49, 49);
    color: #ffffff;
    padding: 16mm 12mm 16mm 16mm;
    display: flex;
    flex-direction: column;
    gap: 3.5mm;
  }
  .full-name {
    font-size: 23pt;
    font-weight: 700;
    color: rgb(255, 221, 80);
    line-height: 1.15;
    margin-bottom: 2px;
    font-family: 'PT Serif', Georgia, serif;
  }
  .job-title-header {
    font-size: 15.5pt;
    font-weight: 400;
    color: rgb(255, 221, 80);
    line-height: 1.2;
    margin-bottom: 3mm;
    font-family: 'PT Serif', Georgia, serif;
  }
  .contact-block {
    display: flex;
    flex-direction: column;
    gap: 1.5mm;
    margin-bottom: 1mm;
  }
  .contact-row {
    font-size: 8.5pt;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    word-break: break-all;
  }
  .contact-svg {
    width: 13px;
    height: 13px;
    fill: rgb(255, 221, 80);
    flex-shrink: 0;
  }

  .left-section-heading {
    display: flex;
    flex-direction: column;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 10pt;
    line-height: 15px;
    color: #ffffff;
    margin-top: 1mm;
    margin-bottom: 1.5mm;
  }
  .left-heading-line {
    width: 2.6em;
    height: 4px;
    background-color: rgb(255, 221, 80);
    border-radius: 1px;
    margin-top: 2px;
  }

  .edu-box {
    font-size: 8.5pt;
    color: #ffffff;
    line-height: 1.25;
  }
  .edu-degree {
    font-weight: 700;
    color: #ffffff;
  }
  .edu-sub {
    color: rgb(255, 221, 80);
    font-size: 8.2pt;
  }

  .skill-category {
    margin-bottom: 2mm;
  }
  .skill-category-title {
    font-weight: 700;
    color: #ffffff;
    font-size: 8.6pt;
    margin-bottom: 0.8mm;
  }
  .skill-list {
    list-style: none;
    padding-left: 0;
  }
  .skill-list li {
    font-size: 8.1pt;
    color: #f1f5f9;
    margin-bottom: 0.7mm;
    display: flex;
    align-items: flex-start;
    gap: 5px;
    line-height: 1.2;
  }
  .skill-dot {
    width: 3.5px;
    height: 3.5px;
    background-color: rgb(255, 221, 80);
    border-radius: 50%;
    margin-top: 4px;
    flex-shrink: 0;
  }

  .lang-box {
    font-size: 8.5pt;
    color: #ffffff;
    line-height: 1.3;
  }

  /* RIGHT COLUMN (60% Width - Clean White Theme) */
  .right-col {
    width: 60%;
    max-width: 60%;
    background-color: #ffffff;
    color: #000000;
    padding: 16mm 16mm 16mm 12mm;
    display: flex;
    flex-direction: column;
    gap: 3mm;
  }
  .right-section-heading {
    display: flex;
    flex-direction: column;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 10pt;
    line-height: 15px;
    color: #000000;
    margin-bottom: 1.5mm;
  }
  .right-heading-line {
    width: 2.6em;
    height: 4px;
    background-color: rgb(215, 132, 8);
    border-radius: 1px;
    margin-top: 2px;
  }
  .summary-text {
    font-size: 8.5pt;
    line-height: 1.25;
    color: #1e293b;
    margin-bottom: 1mm;
  }

  .job-block {
    margin-bottom: 2.5mm;
  }
  .job-role-header {
    font-weight: 700;
    font-size: 8.8pt;
    color: #000000;
    line-height: 1.2;
  }
  .job-company-sub {
    font-weight: 400;
    font-style: italic;
    color: #1e293b;
  }
  .job-meta-row {
    font-size: 8.2pt;
    color: rgb(215, 132, 8);
    font-weight: 600;
    margin-top: 1px;
    margin-bottom: 1mm;
  }
  .bullet-list {
    list-style: none;
    padding-left: 0;
  }
  .bullet-list li {
    font-size: 8.2pt;
    color: #1e293b;
    margin-bottom: 0.8mm;
    display: flex;
    align-items: flex-start;
    gap: 5px;
    line-height: 1.22;
  }
  .bullet-dot {
    width: 3.5px;
    height: 3.5px;
    background-color: #000000;
    border-radius: 50%;
    margin-top: 4px;
    flex-shrink: 0;
  }
</style>
</head>
<body>
  <div class="resume-page">
    <!-- LEFT SIDEBAR -->
    <div class="left-col">
      <div>
        <div class="full-name">AJAY MARIMUTHU</div>
        <div class="job-title-header">{{TARGET_ROLE}}</div>
        
        <div class="contact-block">
          <div class="contact-row">
            <svg class="contact-svg" viewBox="0 0 24 24"><path d="M19.68 20c1.414 0 2.56-1.194 2.56-2.667V10.5l-9.765 4.072a1.005 1.005 0 01-.475.095c-.232 0-.392-.034-.472-.099L1.76 10.5v6.833C1.76 18.806 2.906 20 4.32 20h15.36z"/><path d="M12 11.9l10.24-4.267v-.966C22.24 5.194 21.094 4 19.68 4H4.32C2.906 4 1.76 5.194 1.76 6.667v.966L12 11.9z"/></svg>
            ajay9f01@gmail.com
          </div>
          <div class="contact-row">
            <svg class="contact-svg" viewBox="0 0 24 24"><path d="M22.964 17.632l-.999 4.33a1.336 1.336 0 01-1.31 1.04c-10.834 0-19.65-8.816-19.65-19.66 0-.629.428-1.167 1.04-1.307l4.33-.998a1.352 1.352 0 011.54.778L9.912 6.48c.233.55.076 1.188-.386 1.565L7.214 9.942a15.021 15.021 0 006.854 6.852l1.892-2.312a1.337 1.337 0 011.567-.385l4.66 1.997c.596.258.923.91.777 1.538z"/></svg>
            +91-7010409697
          </div>
          <div class="contact-row">
            <svg class="contact-svg" viewBox="0 0 24 24"><path d="M12.3 24a39.034 39.034 0 01-4.5-4.707c-2.057-2.547-4.5-6.341-4.5-9.957-.002-3.775 2.191-7.18 5.556-8.625 3.364-1.445 7.237-.646 9.81 2.025 1.693 1.748 2.642 4.124 2.634 6.6 0 3.616-2.443 7.41-4.5 9.957A39.041 39.041 0 0112.3 24zm0-18.663c-1.378 0-2.651.762-3.34 2a4.127 4.127 0 000 3.999c.689 1.237 1.962 2 3.34 2 2.13 0 3.857-1.791 3.857-4 0-2.208-1.727-3.999-3.857-3.999z"/></svg>
            Chennai, India
          </div>
          <div class="contact-row">
            <svg class="contact-svg" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            github.com/ajayf773
          </div>
        </div>
      </div>

      <div>
        <div class="left-section-heading">
          EDUCATION
          <div class="left-heading-line"></div>
        </div>
        <div class="edu-box">
          <div class="edu-degree">B.Tech - Mechanical Engineering</div>
          <div class="edu-sub">Anna University (2020)</div>
        </div>
      </div>

      <div>
        <div class="left-section-heading">
          TECHNICAL SKILLS
          <div class="left-heading-line"></div>
        </div>
        
        <div class="skill-category">
          <div class="skill-category-title">Domain & Business Logic</div>
          <ul class="skill-list">
            <li><div class="skill-dot"></div>Vehicle specification analysis</li>
            <li><div class="skill-dot"></div>EV & hybrid fundamentals</li>
            <li><div class="skill-dot"></div>Trim-level differentiation</li>
            <li><div class="skill-dot"></div>Data Validation</li>
            <li><div class="skill-dot"></div>Competitive Analysis</li>
          </ul>
        </div>

        <div class="skill-category">
          <div class="skill-category-title">Tools</div>
          <ul class="skill-list">
            <li><div class="skill-dot"></div>Python (Automation & Data Extraction)</li>
            <li><div class="skill-dot"></div>Power BI & SAP</li>
            <li><div class="skill-dot"></div>SQL Database Management</li>
            <li><div class="skill-dot"></div>Advanced Excel (Macros, Pivots, Validation)</li>
          </ul>
        </div>

        <div class="skill-category">
          <div class="skill-category-title">AI & Automation</div>
          <ul class="skill-list">
            <li><div class="skill-dot"></div>Large Language Models (LLMs)</li>
            <li><div class="skill-dot"></div>Small/Local LLMs</li>
            <li><div class="skill-dot"></div>API Integration</li>
            <li><div class="skill-dot"></div>Generative AI Automation</li>
            <li><div class="skill-dot"></div>Vertex AI / Gemini Enterprise Platform</li>
            <li><div class="skill-dot"></div>REST APIs</li>
            <li><div class="skill-dot"></div>ETL Pipelines</li>
            <li><div class="skill-dot"></div>Workflow Automation</li>
          </ul>
        </div>
      </div>

      <div>
        <div class="left-section-heading">
          LANGUAGES
          <div class="left-heading-line"></div>
        </div>
        <div class="lang-box">
          <strong>English</strong> (TOEFL:7.5) | <strong>Tamil</strong>
        </div>
      </div>
    </div>

    <!-- RIGHT MAIN CONTENT -->
    <div class="right-col">
      <div>
        <div class="right-section-heading">
          PROFESSIONAL SUMMARY
          <div class="right-heading-line"></div>
        </div>
        <div class="summary-text">
          AI Automation & Business Intelligence Engineer with 4+ years of experience designing Python automation, streamlining business processes, and building data-driven solutions. Experienced in developing ETL pipelines, integrating AI and APIs into business workflows, and transforming time-intensive manual operations into scalable automated systems. Passionate about solving real-world business problems through data, automation, and AI.
        </div>
      </div>

      <div>
        <div class="right-section-heading">
          EXPERIENCE
          <div class="right-heading-line"></div>
        </div>

        <div class="job-block">
          <div class="job-role-header">
            Merit Data & Technology Pvt. Ltd.
          </div>
          <div class="job-role-header" style="font-weight: 400; font-style: italic; color: #1e293b;">
            Senior Research Analyst - Automotive Product Data
          </div>
          <div class="job-meta-row">03/2022 – 06/2026 | Chennai</div>
          <ul class="bullet-list">
            <li><div class="bullet-dot"></div>Analyzed and validated vehicle specifications from OEM documentation for global automotive databases.</li>
            <li><div class="bullet-dot"></div>Identified business opportunities through database traffic analysis, competitor benchmarking, and trim-level differentiation.</li>
            <li><div class="bullet-dot"></div>Validated WLTP ranges, CO₂ emissions, EV battery specifications, pricing, and optional equipment to maintain high-quality datasets.</li>
            <li><div class="bullet-dot"></div>Managed large-scale Excel datasets and resolved data inconsistencies for the UK automotive market.</li>
          </ul>
        </div>

        <div class="job-block">
          <div class="job-role-header">
            SKH Sheet Metal Components Pvt. Ltd.
          </div>
          <div class="job-role-header" style="font-weight: 400; font-style: italic; color: #1e293b;">
            Graduate Engineer Trainee
          </div>
          <div class="job-meta-row">11/2020 – 11/2021 | Chennai</div>
          <ul class="bullet-list">
            <li><div class="bullet-dot"></div>Rotated through multiple shop-floor departments to build a practical understanding of Tier-1 manufacturing workflows.</li>
            <li><div class="bullet-dot"></div>Supported daily operations including production monitoring, purchase and dispatch, and quality inspections for sheet metal components.</li>
          </ul>
        </div>
      </div>

      <div>
        <div class="right-section-heading">
          PROJECTS
          <div class="right-heading-line"></div>
        </div>

        <div class="job-block">
          <div class="job-role-header">AI-Powered Vehicle Specification ETL Pipeline</div>
          <div class="job-meta-row">2024 – Present</div>
          <ul class="bullet-list">
            <li><div class="bullet-dot"></div>Built an AI-powered Python ETL pipeline to automatically extract, normalize, validate, and transform structured vehicle specification data from unstructured OEM brochures and technical documentation.</li>
            <li><div class="bullet-dot"></div>Integrated Vertex AI Gemini, local LLMs, REST APIs, and semantic AI workflows to automate feature extraction, entity matching, attribute normalization, and validation.</li>
            <li><div class="bullet-dot"></div>Reduced a manual workflow from approximately 35 hours to 15 minutes through intelligent automation, significantly improving processing efficiency and data consistency.</li>
            <li><div class="bullet-dot"></div>Designed a modular and extensible architecture capable of supporting multiple OEM document formats, scalable validation rules, and future AI model integration.</li>
          </ul>
        </div>
      </div>

    </div>
  </div>
</body>
</html>
"""

# Update templates/cv-template.html as the primary source of truth
template_dest = os.path.join(ROOT, 'templates', 'cv-template.html')
with open(template_dest, 'w', encoding='utf-8') as tf:
    tf.write(FLOWCV_EXACT_TEMPLATE)

print("✅ Updated templates/cv-template.html with exact FlowCV settings!")

# Read shortlisted jobs from applications.md
with open(apps_md_path, 'r', encoding='utf-8') as f:
    apps_content = f.read()

lines = apps_content.split('\n')
targets = []

for line in lines:
    if line.strip().startswith('|') and not line.strip().startswith('| #') and not line.strip().startswith('|---'):
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 9:
            job_id = parts[1]
            date = parts[2]
            company = parts[3]
            role = parts[4]
            score_str = parts[5].replace('/5', '').strip()

            try:
                score = float(score_str)
            except ValueError:
                score = 0.0

            if score >= 3.5:
                targets.append({
                    "id": job_id,
                    "company": company,
                    "role": role,
                    "score": score
                })

print(f"📋 Rendering {len(targets)} exact FlowCV resumes (PT Serif, 9pt, 16mm margins)...")

success_count = 0

for job in targets:
    company_clean = re.sub(r'[^a-zA-Z0-9]', '_', job['company'].lower()).strip('_')
    pdf_name = f"Resume_{job['id']}_{company_clean}.pdf"
    pdf_path = os.path.join(output_dir, pdf_name)
    html_temp_path = os.path.join(output_dir, f"temp_{job['id']}.html")

    html_rendered = FLOWCV_EXACT_TEMPLATE.replace('{{TARGET_ROLE}}', job['role'])

    with open(html_temp_path, 'w', encoding='utf-8') as hf:
        hf.write(html_rendered)

    res = subprocess.run([
        'node', 'generate-pdf.mjs',
        html_temp_path, pdf_path,
        f'--report={job["id"]}', '--allow-reorder', '--max-pages=1'
    ], capture_output=True, text=True)

    if os.path.exists(html_temp_path):
        os.remove(html_temp_path)

    if res.returncode == 0:
        print(f"  -> 🎯 [FLOWCV PT SERIF PDF] Rendered for #{job['id']}: {job['company']} — {job['role']} ({job['score']}/5)")
        success_count += 1

print(f"\n🎉 SUCCESS! Rendered {success_count} exact FlowCV Resumes in:")
print(f"👉 {output_dir}\n")

print("📊 Updating Excel Workbook output/Top_Jobs_Analysis.xlsx with fresh PDF links...")
subprocess.run(['node', 'batch/generate-excel-xlsx.mjs'], check=True)
