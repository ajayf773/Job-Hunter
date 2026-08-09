#!/usr/bin/env python3
import os
import sys
import subprocess
import pandas as pd

def build_all_openresume_pdfs():
    excel_path = os.path.join("output", "Top_Jobs_Analysis.xlsx")
    output_dir = os.path.join("output", "tailored-resumes")
    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(excel_path):
        print(f"❌ Excel file not found: {excel_path}")
        sys.exit(1)

    df = pd.read_excel(excel_path)
    print(f"📊 Total jobs in Excel: {len(df)}")
    print(f"📋 Excel Columns: {list(df.columns)}")

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
        
        company_clean = "".join(c if c.isalnum() else "_" for c in company).strip("_")
        role_clean = "".join(c if c.isalnum() else "_" for c in role).strip("_")
        pdf_filename = f"Resume_{report_num}_{company_clean}_{role_clean}.pdf"
        pdf_path = os.path.join(output_dir, pdf_filename)
        
        cmd = ["node", cli_script, role, pdf_path]
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            rendered_count += 1
            print(f"  -> 🎯 [OPENRESUME REACT PDF] Rendered #{report_num}: {company} — {role} ({score_val}/5)")
        except subprocess.CalledProcessError as e:
            print(f"  ❌ Error rendering #{report_num}: {e.stderr}")

    print(f"\n🎉 Successfully rendered {rendered_count} OpenResume React PDF resumes into {output_dir}!")

if __name__ == "__main__":
    build_all_openresume_pdfs()
