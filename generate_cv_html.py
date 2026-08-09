import os

with open("templates/cv-template.html", "r") as f:
    template = f.read()

replacements = {
    "{{LANG}}": "en",
    "{{NAME}}": "Ajay Marimuthu",
    "{{PAGE_WIDTH}}": "8.5in",
    "{{PHOTO}}": "",
    "{{PHONE}}": "+91-7010409697",
    "{{EMAIL}}": "ajay9f01@gmail.com",
    "{{LINKEDIN_URL}}": "",
    "{{LINKEDIN_DISPLAY}}": "",
    "{{PORTFOLIO_URL}}": "",
    "{{PORTFOLIO_DISPLAY}}": "",
    "{{LOCATION}}": "Chennai, India",
    "{{SECTION_SUMMARY}}": "PROFESSIONAL SUMMARY",
    "{{SUMMARY_TEXT}}": "Data Engineer with 5 years of experience building scalable data infrastructure, ETL/ELT pipelines, and AI-powered analytical tooling. Experienced in Python and SQL, with a strong focus on data quality, data governance, and transforming manual processes into automated solutions. Adept at building data foundations that monitor models and support robust abuse detection for Safeguards teams. At Merit Data, designed an AI-powered ETL pipeline reducing processing workflows from 35 hours to 15 minutes, demonstrating a high-impact approach to complex data challenges.",
    "{{SECTION_COMPETENCIES}}": "CORE COMPETENCIES",
    "{{COMPETENCIES}}": '<div class="competency-tag">Python & SQL</div><div class="competency-tag">ETL / ELT Pipelines</div><div class="competency-tag">Data Infrastructure</div><div class="competency-tag">Warehousing Solutions</div><div class="competency-tag">Data Quality & Governance</div><div class="competency-tag">dbt & Airflow</div><div class="competency-tag">Cloud Platforms (GCP)</div><div class="competency-tag">Analytical Tooling</div>',
    "{{SECTION_EXPERIENCE}}": "PROFESSIONAL EXPERIENCE",
    "{{EXPERIENCE}}": """<div class="job">
  <div class="job-header">
    <span class="job-company">Merit Data & Technology Pvt. Ltd.</span>
    <span class="job-period">Mar 2022 – Jun 2026</span>
  </div>
  <div class="job-role">Senior Research Analyst – Automotive Product Data</div>
  <div class="job-location">Chennai, India</div>
  <ul>
    <li>Designed and built <strong>scalable data pipelines</strong> to extract, validate, and transform complex automotive specification data into structured warehousing solutions.</li>
    <li>Maintained high-quality datasets through robust <strong>data quality</strong> frameworks, resolving data inconsistencies across millions of records.</li>
    <li>Collaborated with global teams to monitor models and ensure the reliability of data infrastructure for competitive benchmarking.</li>
    <li>Supported analytics engineering efforts, managing large-scale data workflows and enforcing data governance practices.</li>
  </ul>
</div>
<div class="job">
  <div class="job-header">
    <span class="job-company">SKH Sheet Metal Components Pvt. Ltd.</span>
    <span class="job-period">Nov 2020 – Nov 2021</span>
  </div>
  <div class="job-role">Graduate Engineer Trainee</div>
  <div class="job-location">Chennai, India</div>
  <ul>
    <li>Assisted in production monitoring and daily manufacturing operations, analyzing operational data.</li>
    <li>Participated in quality inspection processes, identifying patterns and ensuring compliance with standards.</li>
  </ul>
</div>""",
    "{{SECTION_PROJECTS}}": "PROJECTS",
    "{{PROJECTS}}": """<div class="project">
  <div class="project-title">AI-Powered Specification ETL Pipeline<span class="project-badge">High Impact</span></div>
  <div class="project-desc">Designed an end-to-end Python ETL pipeline integrating AI workflows for processing unstructured data into structured analytical models. Automated feature extraction, entity matching, and data validation, reducing manual processing from 35 hours to 15 minutes. Designed scalable architecture for future BigQuery/Snowflake integration.</div>
  <div class="project-tech">Python, SQL, ETL/ELT, GCP, REST APIs</div>
</div>""",
    "{{SECTION_EDUCATION}}": "EDUCATION",
    "{{EDUCATION}}": """<div class="edu-item">
  <div class="edu-header">
    <span class="edu-title">Bachelor of Technology (B.Tech) – Mechanical Engineering</span>
    <span class="edu-year">2020</span>
  </div>
</div>""",
    "{{SECTION_CERTIFICATIONS}}": "",
    "{{CERTIFICATIONS}}": "",
    "{{SECTION_SKILLS}}": "TECHNICAL SKILLS",
    "{{SKILLS}}": """<div class="skills-grid">
  <div class="skill-item"><span class="skill-category">Languages & Databases:</span> Python, SQL</div>
  <div class="skill-item"><span class="skill-category">Data Engineering:</span> ETL/ELT Pipelines, Data Infrastructure, dbt, Airflow, Data Quality, Data Governance</div>
  <div class="skill-item"><span class="skill-category">Cloud & Warehousing:</span> GCP, Azure, BigQuery, Snowflake, Redshift</div>
  <div class="skill-item"><span class="skill-category">Analytics & BI:</span> Looker, Tableau, Metabase, Power BI</div>
</div>"""
}

for k, v in replacements.items():
    template = template.replace(k, str(v))

with open("output/cv-candidate-anthropic.html", "w") as f:
    f.write(template)
