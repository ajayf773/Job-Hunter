#!/usr/bin/env python3
import os
import sys
import glob
import re
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

def generate_tailored_summary(role, report_info):
    """Generate role-tailored professional summary based on report domain & function"""
    base_summary = "AI Automation & Business Intelligence Engineer with 4+ years of experience designing Python automation, streamlining business processes, and building data-driven solutions."
    
    domain = report_info.get("domain", "") if report_info else ""
    func = report_info.get("function", "") if report_info else ""
    role_lower = role.lower()

    if "agent" in role_lower or "llm" in role_lower or "genai" in role_lower or "agent" in domain.lower():
        tailored = f"{base_summary} Specializing in developing agentic AI workflows, LLM/Vertex AI integration, and Python ETL pipelines that transform complex manual operations into scalable automated systems."
    elif "data" in role_lower or "bi" in role_lower or "analytics" in role_lower or "data" in domain.lower():
        tailored = f"{base_summary} Specialized in automotive product data validation, ETL pipelines, SQL/Power BI analytics, and automated specification benchmarking for enterprise databases."
    elif "backend" in role_lower or "software" in role_lower or "platform" in role_lower:
        tailored = f"{base_summary} Focused on robust Python backend automation, REST API integration, data pipeline architecture, and enterprise AI workflow deployment."
    else:
        tailored = f"{base_summary} Experienced in developing ETL pipelines, integrating AI and APIs into business workflows, and transforming time-intensive manual operations into scalable automated systems."

    return tailored

def build_all_openresume_pdfs():
    excel_path = os.path.join("output", "Top_Jobs_Analysis.xlsx")
    output_dir = os.path.join("output", "tailored-resumes")
    os.makedirs(output_dir, exist_ok=True)

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

    cli_script = os.path.join("open-resume", "render-openresume-pdf.mjs")
    if not os.path.exists(cli_script):
        print(f"❌ OpenResume renderer script not found: {cli_script}")
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
        
        # Analyze evaluation report
        report_info = parse_report_file(report_num)
        tailored_summary = generate_tailored_summary(role, report_info)

        company_clean = "".join(c if c.isalnum() else "_" for c in company).strip("_")
        role_clean = "".join(c if c.isalnum() else "_" for c in role).strip("_")
        pdf_filename = f"Resume_{report_num}_{company_clean}_{role_clean}.pdf"
        pdf_path = os.path.join(output_dir, pdf_filename)
        
        # Pass tailored summary to OpenResume renderer CLI
        cmd = ["node", cli_script, role, pdf_path, tailored_summary]
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            rendered_count += 1
            has_report = "📊 Report Analyzed" if report_info else "📋 Direct Tailoring"
            print(f"  -> 🎯 [OPENRESUME REACT PDF] Rendered #{report_num}: {company} — {role} ({score_val}/5) [{has_report}]")
        except subprocess.CalledProcessError as e:
            print(f"  ❌ Error rendering #{report_num}: {e.stderr}")

    print(f"\n🎉 Successfully rendered {rendered_count} Report-Tailored OpenResume React PDF resumes into {output_dir}!")

if __name__ == "__main__":
    build_all_openresume_pdfs()
