const fs = require('fs');

let template = fs.readFileSync('templates/cv-template.html', 'utf-8');

const html = template
  .replace(/\{\{LANG\}\}/g, 'en')
  .replace(/\{\{NAME\}\}/g, 'Ajay Marimuthu')
  .replace(/\{\{PAGE_WIDTH\}\}/g, '100%')
  .replace(/\{\{PHOTO\}\}/g, '')
  .replace(/\{\{PHONE\}\}/g, '+91-7010409697')
  .replace(/\{\{EMAIL\}\}/g, 'ajay9f01@gmail.com')
  .replace(/\{\{LINKEDIN_URL\}\}/g, '#')
  .replace(/\{\{LINKEDIN_DISPLAY\}\}/g, 'LinkedIn')
  .replace(/\{\{PORTFOLIO_URL\}\}/g, '#')
  .replace(/\{\{PORTFOLIO_DISPLAY\}\}/g, 'Portfolio')
  .replace(/\{\{LOCATION\}\}/g, 'Chennai, India')
  .replace(/\{\{SECTION_SUMMARY\}\}/g, 'Professional Summary')
  .replace(/\{\{SUMMARY_TEXT\}\}/g, 'AI Solutions Architect and Automation Engineer with 4+ years of experience building automation solutions, scalable cloud architectures, and AI-powered business workflows. Skilled at integrating Claude and other LLMs into enterprise tech stacks. Proven track record of transforming manual business processes into intelligent systems, such as reducing an ETL workflow from 35 hours to 15 minutes. Passionate about helping organizations understand and successfully deploy reliable, steerable AI systems.')
  .replace(/\{\{SECTION_COMPETENCIES\}\}/g, 'Core Competencies')
  .replace(/\{\{COMPETENCIES\}\}/g, '<span class="competency-tag">AI Solutions Architecture</span><span class="competency-tag">Enterprise Integration</span><span class="competency-tag">Python & LLM Frameworks</span><span class="competency-tag">Stakeholder Management</span><span class="competency-tag">Cloud Architecture (GCP/Azure)</span><span class="competency-tag">Pre-Sales Technical Advising</span>')
  .replace(/\{\{SECTION_EXPERIENCE\}\}/g, 'Professional Experience')
  .replace(/\{\{EXPERIENCE\}\}/g, `
    <div class="job">
      <div class="job-header">
        <span class="job-company">Merit Data & Technology Pvt. Ltd.</span>
        <span class="job-period">March 2022 – June 2026</span>
      </div>
      <div class="job-role">Senior Research Analyst – Automotive Product Data</div>
      <div class="job-location">Chennai, India</div>
      <ul>
        <li>Acted as a technical advisor for complex vehicle specification data integration for global automotive databases.</li>
        <li>Managed cross-functional stakeholder communication to ensure high-quality dataset validation and discrepancy resolution.</li>
        <li>Identified business value opportunities through traffic analysis, competitive benchmarking, and AI integration strategies.</li>
      </ul>
    </div>
    <div class="job">
      <div class="job-header">
        <span class="job-company">SKH Sheet Metal Components Pvt. Ltd.</span>
        <span class="job-period">November 2020 – November 2021</span>
      </div>
      <div class="job-role">Graduate Engineer Trainee</div>
      <div class="job-location">Chennai, India</div>
      <ul>
        <li>Rotated across multiple manufacturing departments to understand complex enterprise production workflows and supply chain operations.</li>
      </ul>
    </div>
  `)
  .replace(/\{\{SECTION_PROJECTS\}\}/g, 'Key Projects')
  .replace(/\{\{PROJECTS\}\}/g, `
    <div class="project">
      <div class="project-title">AI-Powered Specification ETL Pipeline <span class="project-badge">Architect & Developer</span></div>
      <div class="project-desc">Designed and deployed a highly scalable AI-powered pipeline to extract, validate, and normalize technical data from unstructured sources.</div>
      <div class="project-tech"><strong>Impact:</strong> Reduced manual enterprise workflow from 35 hours to 15 minutes. <strong>Tech:</strong> Python, Vertex AI, Local LLMs, REST APIs, GCP.</div>
    </div>
  `)
  .replace(/\{\{SECTION_EDUCATION\}\}/g, 'Education')
  .replace(/\{\{EDUCATION\}\}/g, `
    <div class="edu-item">
      <div class="edu-header">
        <span class="edu-title">Bachelor of Technology (B.Tech) – Mechanical Engineering</span>
        <span class="edu-year">2020</span>
      </div>
    </div>
  `)
  .replace(/\{\{SECTION_CERTIFICATIONS\}\}/g, 'Languages')
  .replace(/\{\{CERTIFICATIONS\}\}/g, `
    <div class="cert-item">
      <span class="cert-title">English (TOEFL: 7.5), Tamil</span>
    </div>
  `)
  .replace(/\{\{SECTION_SKILLS\}\}/g, 'Technical Skills')
  .replace(/\{\{SKILLS\}\}/g, `
    <div class="skills-grid">
      <div><span class="skill-category">AI & ML:</span> <span class="skill-item">Generative AI, Large Language Models, Claude, RAG, Agentic AI, AI Infrastructure, MLOps</span></div>
      <div><span class="skill-category">Engineering:</span> <span class="skill-item">Python, API Integration, Backend Engineering, SQL, ETL Pipelines, Workflow Automation</span></div>
      <div><span class="skill-category">Cloud & Tools:</span> <span class="skill-item">GCP, Azure, Docker, Power BI, Advanced Excel</span></div>
    </div>
  `);

fs.writeFileSync('output/cv-candidate-anthropic.html', html);
console.log('HTML written successfully.');
