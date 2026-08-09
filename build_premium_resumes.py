#!/usr/bin/env python3
import os
import sys
import glob
import re
import json
import subprocess
import pandas as pd

def parse_report_file(report_num):
    """Find and extract key role context from reports/{###}-*.md"""
    reports_dir = "reports"
    pattern = os.path.join(reports_dir, f"{str(report_num).zfill(3)}*.md")
    matches = glob.glob(pattern)
    if not matches:
        pattern_raw = os.path.join(reports_dir, f"{report_num}*.md")
        matches = glob.glob(pattern_raw)
    
    if not matches:
        return None

    report_path = matches[0]
    try:
        with open(report_path, "r", encoding="utf-8") as f:
            content = f.read()

        domain_match = re.search(r"\|\s*\*\*Domain\*\*\s*\|\s*([^|\n]+)", content)
        domain = domain_match.group(1).strip() if domain_match else ""

        function_match = re.search(r"\|\s*\*\*Function\*\*\s*\|\s*([^|\n]+)", content)
        func = function_match.group(1).strip() if function_match else ""

        tldr_match = re.search(r"\|\s*\*\*TL;DR\*\*\s*\|\s*([^|\n]+)", content)
        tldr = tldr_match.group(1).strip() if tldr_match else ""

        return {
            "domain": domain,
            "function": func,
            "tldr": tldr,
            "path": report_path
        }
    except Exception as e:
        return None

def generate_ai_tailored_json(report_num, company, role, report_info):
    base_summary = "AI Automation & Business Intelligence Engineer with 4+ years of experience designing Python automation, streamlining business processes, and building data-driven solutions."
    
    domain = report_info.get("domain", "") if report_info else ""
    func = report_info.get("function", "") if report_info else ""
    role_lower = role.lower()

    if "agent" in role_lower or "llm" in role_lower or "genai" in role_lower or "agent" in domain.lower():
        headline = f"{role} — GenAI & Agentic AI Specialist"
        summary = f"{base_summary} Specializing in developing agentic AI workflows, LLM/Vertex AI integration, and Python ETL pipelines that transform complex manual operations into scalable automated systems."
        exp_bullets = [
            "Analyzed and validated vehicle specifications from OEM documentation for global automotive databases.",
            "Identified business opportunities through database traffic analysis, competitor benchmarking, and trim-level differentiation.",
            "Validated WLTP ranges, CO2 emissions, EV battery specifications, pricing, and optional equipment for enterprise datasets.",
            "Managed large-scale Excel datasets and resolved data inconsistencies for global automotive markets."
        ]
        proj_bullets = [
            "Built an AI-powered Python ETL pipeline to automatically extract, normalize, validate, and transform structured vehicle specification data from unstructured OEM brochures.",
            "Integrated Vertex AI Gemini, local LLMs, REST APIs, and semantic AI workflows to automate feature extraction, entity matching, attribute normalization, and validation.",
            "Reduced a manual workflow from approximately 35 hours to 15 minutes through intelligent automation, significantly improving processing efficiency and data consistency.",
            "Designed a modular and extensible architecture capable of supporting multiple OEM document formats, scalable validation rules, and future AI model integration."
        ]
        ai_skills = ["Agentic AI Workflows", "Vertex AI Gemini Platform", "LLMs & Local Small Models", "REST APIs & JSON Pipelines", "Generative AI Automation"]
    elif "data" in role_lower or "bi" in role_lower or "analytics" in role_lower or "data" in domain.lower():
        headline = f"{role} — Data Pipeline & BI Engineer"
        summary = f"{base_summary} Specialized in automotive product data validation, ETL pipelines, SQL/Power BI analytics, and automated specification benchmarking for enterprise databases."
        exp_bullets = [
            "Engineered automated data validation rules for vehicle specifications extracted from OEM technical documentation.",
            "Analyzed trim-level differentiation, pricing matrices, and WLTP CO2 emission datasets to identify business growth channels.",
            "Benchmarked OEM competitor datasets across global vehicle platforms to maintain 100% data integrity.",
            "Created automated Excel macros, SQL queries, and validation pipelines for large-scale product catalogs."
        ]
        proj_bullets = [
            "Developed an automated Python ETL data pipeline extracting and transforming unstructured OEM catalog attributes into structured database schemas.",
            "Implemented automated validation algorithms to verify WLTP ranges, EV battery stats, and pricing attributes.",
            "Optimized data extraction runtime from 35 hours to 15 minutes, ensuring reliable data delivery.",
            "Designed scalable data pipelines integrating Python, SQL, REST APIs, and Power BI dashboards."
        ]
        ai_skills = ["Data Extraction & ETL", "Python Automation", "SQL & Database Management", "Power BI Analytics", "REST APIs & Data Models"]
    else:
        headline = f"{role} — AI & Systems Engineer"
        summary = f"{base_summary} Experienced in developing ETL pipelines, integrating AI and APIs into business workflows, and transforming time-intensive manual operations into scalable automated systems."
        exp_bullets = [
            "Analyzed and validated vehicle specifications from OEM documentation for global automotive databases.",
            "Identified business opportunities through database traffic analysis, competitor benchmarking, and trim-level differentiation.",
            "Validated WLTP ranges, CO2 emissions, EV battery specifications, pricing, and optional equipment.",
            "Managed large-scale Excel datasets and resolved data inconsistencies for the automotive market."
        ]
        proj_bullets = [
            "Built an AI-powered Python ETL pipeline to automatically extract, normalize, validate, and transform structured vehicle specification data.",
            "Integrated Vertex AI Gemini, local LLMs, REST APIs, and semantic AI workflows to automate feature extraction and validation.",
            "Reduced a manual workflow from approximately 35 hours to 15 minutes through intelligent automation.",
            "Designed a modular architecture supporting multiple OEM document formats and future AI model integration."
        ]
        ai_skills = ["LLMs & AI Platform Integration", "Python Automation", "REST APIs & Microservices", "ETL Pipelines & Validation", "Workflow Optimization"]

    payload = {
        "name": "AJAY MARIMUTHU",
        "title": headline,
        "email": "ajay9f01@gmail.com",
        "phone": "+91-9489101583 | +91-7010409697 (WA)",
        "location": "Chennai, India",
        "github": "github.com/ajayf773",
        "summary": summary,
        "experience": [
            {
                "company": "Merit Data & Technology Pvt. Ltd.",
                "role": "Senior Research Analyst - Automotive Product Data",
                "dates": "03/2022 – 06/2026 | Chennai, India",
                "bullets": exp_bullets
            },
            {
                "company": "SKH Sheet Metal Components Pvt. Ltd.",
                "role": "Graduate Engineer Trainee",
                "dates": "11/2020 – 11/2021 | Chennai, India",
                "bullets": [
                    "Rotated through shop-floor departments to build a practical understanding of Tier-1 manufacturing workflows.",
                    "Supported daily operations including production monitoring, dispatch, and quality inspections."
                ]
            }
        ],
        "projects": [
            {
                "name": "AI-Powered Vehicle Specification ETL Pipeline",
                "dates": "2024 – Present",
                "bullets": proj_bullets
            }
        ],
        "skills": {
            "domain": ["Vehicle Specification Analysis", "EV & Hybrid Fundamentals", "Trim-Level Differentiation", "Data Validation", "Competitive Benchmarking"],
            "tools": ["Python (Automation & ETL)", "Power BI & SAP", "SQL Database Management", "Advanced Excel & Macros"],
            "ai": ai_skills
        }
    }
    return payload

def build_all_premium_pdfs():
    excel_path = os.path.join("output", "Top_Jobs_Analysis.xlsx")
    output_dir = os.path.join("output", "tailored-resumes")
    temp_html_dir = os.path.join("output", "temp_html")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(temp_html_dir, exist_ok=True)
    
    template_path = os.path.join("templates", "premium-template.html")
    if not os.path.exists(template_path):
        print(f"❌ Template not found: {template_path}")
        sys.exit(1)
        
    with open(template_path, "r", encoding="utf-8") as f:
        template_html = f.read()

    if not os.path.exists(excel_path):
        print(f"❌ Excel file not found: {excel_path}")
        sys.exit(1)

    df = pd.read_excel(excel_path)
    print(f"📊 Total jobs in Excel: {len(df)}")

    score_col = [c for c in df.columns if 'score' in str(c).lower() or 'fit' in str(c).lower()]
    score_name = score_col[0] if score_col else df.columns[4]
    company_col = [c for c in df.columns if 'company' in str(c).lower()][0]
    role_col = [c for c in df.columns if 'role' in str(c).lower() or 'title' in str(c).lower()][0]
    report_col = df.columns[0]

    cli_script = "generate-pdf.mjs"
    if not os.path.exists(cli_script):
        print(f"❌ PDF renderer script not found: {cli_script}")
        sys.exit(1)

    rendered_count = 0
    for idx, row in df.iterrows():
        try:
            score_val = float(str(row[score_name]).split('/')[0].strip())
        except:
            score_val = 4.0
            
        if score_val < 3.5:
            continue

        report_num = str(row[report_col])
        company = str(row[company_col]).strip()
        role = str(row[role_col]).strip()
        
        # Analyze evaluation report & generate AI-tailored JSON payload
        report_info = parse_report_file(report_num)
        payload = generate_ai_tailored_json(report_num, company, role, report_info)

        # Generate HTML blocks
        exp_html = ""
        for exp in payload["experience"]:
            bullets_html = "".join([f"<li>{b}</li>" for b in exp["bullets"]])
            exp_html += f'''
            <div class="item">
              <div class="item-header">
                <div><span class="item-title">{exp["role"]}</span> <span class="item-subtitle">| {exp["company"]}</span></div>
                <div class="item-date">{exp["dates"]}</div>
              </div>
              <ul class="item-bullets">
                {bullets_html}
              </ul>
            </div>
            '''
            
        proj_html = ""
        for proj in payload["projects"]:
            bullets_html = "".join([f"<li>{b}</li>" for b in proj["bullets"]])
            proj_html += f'''
            <div class="item">
              <div class="item-header">
                <span class="item-title">{proj["name"]}</span>
                <span class="item-date">{proj["dates"]}</span>
              </div>
              <ul class="item-bullets">
                {bullets_html}
              </ul>
            </div>
            '''
            
        skills_html = ""
        skills_html += '<div class="sidebar-block"><div class="sidebar-heading">Domain & Business</div><div class="skill-pill-container">'
        skills_html += "".join([f'<div class="skill-pill">{s}</div>' for s in payload["skills"]["domain"]])
        skills_html += '</div></div>'
        
        skills_html += '<div class="sidebar-block"><div class="sidebar-heading">Tools & Engineering</div><div class="skill-pill-container">'
        skills_html += "".join([f'<div class="skill-pill">{s}</div>' for s in payload["skills"]["tools"]])
        skills_html += '</div></div>'
        
        skills_html += '<div class="sidebar-block"><div class="sidebar-heading">AI & Automation</div><div class="skill-pill-container">'
        skills_html += "".join([f'<div class="skill-pill">{s}</div>' for s in payload["skills"]["ai"]])
        skills_html += '</div></div>'
        
        # Replace template placeholders
        html_out = template_html.replace("{{NAME}}", payload["name"])
        html_out = html_out.replace("{{TITLE}}", payload["title"])
        html_out = html_out.replace("{{EMAIL}}", payload["email"])
        html_out = html_out.replace("{{PHONE}}", payload["phone"])
        html_out = html_out.replace("{{LOCATION}}", payload["location"])
        html_out = html_out.replace("{{GITHUB}}", payload["github"])
        html_out = html_out.replace("{{SUMMARY}}", payload["summary"])
        html_out = html_out.replace("{{EXPERIENCE_HTML}}", exp_html)
        html_out = html_out.replace("{{PROJECTS_HTML}}", proj_html)
        html_out = html_out.replace("{{SKILLS_HTML}}", skills_html)
        
        company_clean = "".join(c if c.isalnum() else "_" for c in company).strip("_")
        role_clean = "".join(c if c.isalnum() else "_" for c in role).strip("_")
        
        html_path = os.path.join(temp_html_dir, f"resume_{report_num}_{company_clean}_{role_clean}.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_out)

        pdf_filename = f"Resume_{report_num}_{company_clean}_{role_clean}.pdf"
        pdf_path = os.path.join(output_dir, pdf_filename)
        
        # Call node generate-pdf.mjs
        cmd = ["node", cli_script, html_path, pdf_path, "--allow-reorder", "--max-pages=1"]
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            rendered_count += 1
            has_report = "🤖 AI Report Analyzed" if report_info else "📋 Tailored AI Payload"
            print(f"  -> 🎯 [PREMIUM TEMPLATE] Rendered #{report_num}: {company} — {role} ({score_val}/5) [{has_report}]")
        except subprocess.CalledProcessError as e:
            print(f"  ❌ Error rendering #{report_num}: {e.stderr}")

    print(f"\n🎉 Successfully rendered {rendered_count} Premium Report-Tailored PDF resumes into {output_dir}!")

if __name__ == "__main__":
    build_all_premium_pdfs()
