import React from 'react';
import { renderToFile, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import fs from 'fs';

const e = React.createElement;

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 8.8,
    lineHeight: 1.25,
  },
  /* LEFT SIDEBAR (Dark Slate #2D3748 & Gold Accents) */
  sidebar: {
    width: '32%',
    backgroundColor: '#2D3748',
    color: '#FFFFFF',
    padding: 16,
    flexDirection: 'column',
  },
  name: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFDD50',
    marginBottom: 4,
    lineHeight: 1.1,
  },
  title: {
    fontSize: 10,
    color: '#E2E8F0',
    marginBottom: 14,
    fontWeight: 'bold',
  },
  sidebarSection: {
    marginBottom: 13,
  },
  sidebarHeading: {
    fontSize: 9.2,
    fontWeight: 'bold',
    color: '#FFDD50',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#4A5568',
    borderBottomStyle: 'solid',
    paddingBottom: 2,
    marginBottom: 6,
  },
  contactItem: {
    fontSize: 8,
    color: '#EDF2F7',
    marginBottom: 3.5,
    lineHeight: 1.25,
  },
  skillBlock: {
    marginBottom: 5,
  },
  skillCatTitle: {
    fontSize: 8.2,
    fontWeight: 'bold',
    color: '#FFDD50',
    marginBottom: 1.5,
  },
  skillText: {
    fontSize: 7.8,
    color: '#EDF2F7',
    lineHeight: 1.2,
  },

  /* RIGHT MAIN CONTENT (Clean White with Amber Accents) */
  mainContent: {
    width: '68%',
    padding: 18,
    flexDirection: 'column',
  },
  section: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 9.8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#D78408',
    borderBottomWidth: 1.5,
    borderBottomColor: '#D78408',
    borderBottomStyle: 'solid',
    paddingBottom: 2,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 8.5,
    color: '#2D3748',
    lineHeight: 1.3,
  },
  jobBlock: {
    marginBottom: 7,
  },
  jobTitle: {
    fontSize: 9.2,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  companySub: {
    fontSize: 8.5,
    color: '#4A5568',
    fontStyle: 'italic',
  },
  metaRow: {
    fontSize: 8,
    color: '#D78408',
    marginBottom: 3,
    fontWeight: 'bold',
  },
  bulletList: {
    marginLeft: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2.2,
  },
  bulletDot: {
    width: 3,
    height: 3,
    backgroundColor: '#D78408',
    borderRadius: 1.5,
    marginRight: 4,
    marginTop: 3,
  },
  bulletText: {
    fontSize: 8.2,
    color: '#2D3748',
    flex: 1,
    lineHeight: 1.25,
  }
});

const createBullet = (text, idx) => 
  e(View, { style: styles.bulletItem, key: idx || text },
    e(View, { style: styles.bulletDot }),
    e(Text, { style: styles.bulletText }, text)
  );

const FlowCVOpenResumePDFDocument = ({ data }) => {
  const {
    name = "AJAY MARIMUTHU",
    title = "AI Automation & Business Intelligence Engineer",
    email = "ajay9f01@gmail.com",
    phone = "+91-9489101583 | +91-7010409697 (WA)",
    location = "Chennai, India",
    github = "github.com/ajayf773",
    summary = "AI Automation & Business Intelligence Engineer with 4+ years of experience designing Python automation, streamlining business processes, and building data-driven solutions.",
    experience = [],
    projects = [],
    skills = {}
  } = data;

  const expBlocks = (experience.length > 0 ? experience : [
    {
      company: "Merit Data & Technology Pvt. Ltd.",
      role: "Senior Research Analyst - Automotive Product Data",
      dates: "03/2022 – 06/2026 | Chennai, India",
      bullets: [
        "Analyzed and validated vehicle specifications from OEM documentation for global automotive databases.",
        "Identified business opportunities through database traffic analysis, competitor benchmarking, and trim-level differentiation.",
        "Validated WLTP ranges, CO2 emissions, EV battery specifications, pricing, and optional equipment to maintain high-quality datasets.",
        "Managed large-scale Excel datasets and resolved data inconsistencies for the UK automotive market."
      ]
    },
    {
      company: "SKH Sheet Metal Components Pvt. Ltd.",
      role: "Graduate Engineer Trainee",
      dates: "11/2020 – 11/2021 | Chennai, India",
      bullets: [
        "Rotated through multiple shop-floor departments to build a practical understanding of Tier-1 manufacturing workflows.",
        "Supported daily operations including production monitoring, purchase and dispatch, and quality inspections for sheet metal components."
      ]
    }
  ]).map((item, idx) => 
    e(View, { style: styles.jobBlock, key: idx },
      e(Text, { style: styles.jobTitle }, item.company),
      e(Text, { style: styles.companySub }, item.role),
      e(Text, { style: styles.metaRow }, item.dates || item.location || ""),
      e(View, { style: styles.bulletList },
        (item.bullets || []).map((b, bIdx) => createBullet(b, bIdx))
      )
    )
  );

  const projBlocks = (projects.length > 0 ? projects : [
    {
      name: "AI-Powered Vehicle Specification ETL Pipeline",
      dates: "2024 – Present",
      bullets: [
        "Built an AI-powered Python ETL pipeline to automatically extract, normalize, validate, and transform structured vehicle specification data from unstructured OEM brochures and technical documentation.",
        "Integrated Vertex AI Gemini, local LLMs, REST APIs, and semantic AI workflows to automate feature extraction, entity matching, attribute normalization, and validation.",
        "Reduced a manual workflow from approximately 35 hours to 15 minutes through intelligent automation, significantly improving processing efficiency and data consistency.",
        "Designed a modular and extensible architecture capable of supporting multiple OEM document formats, scalable validation rules, and future AI model integration."
      ]
    }
  ]).map((item, idx) =>
    e(View, { style: styles.jobBlock, key: idx },
      e(Text, { style: styles.jobTitle }, item.name),
      e(Text, { style: styles.metaRow }, item.dates || ""),
      e(View, { style: styles.bulletList },
        (item.bullets || []).map((b, bIdx) => createBullet(b, bIdx))
      )
    )
  );

  const domainSkillsStr = Array.isArray(skills.domain) ? skills.domain.join(", ") : "Vehicle Specs, EV/Hybrid Data, Trim Differentiation, Validation, Competitive Benchmarking";
  const toolSkillsStr = Array.isArray(skills.tools) ? skills.tools.join(", ") : "Python, Power BI, SAP, SQL, Advanced Excel, Macros";
  const aiSkillsStr = Array.isArray(skills.ai) ? skills.ai.join(", ") : "LLMs, Gemini / Vertex AI, REST APIs, ETL Pipelines, Generative AI";

  return e(Document, { title: `${name} Resume`, author: name, producer: "Job-Hunter AI Gemini OpenResume Builder" },
    e(Page, { size: "A4", style: styles.page },
      /* LEFT SIDEBAR */
      e(View, { style: styles.sidebar },
        e(Text, { style: styles.name }, name),
        e(Text, { style: styles.title }, title),
        
        e(View, { style: styles.sidebarSection },
          e(Text, { style: styles.sidebarHeading }, "Contact"),
          e(Text, { style: styles.contactItem }, email),
          e(Text, { style: styles.contactItem }, "+91-9489101583"),
          e(Text, { style: styles.contactItem }, "+91-7010409697 (WA)"),
          e(Text, { style: styles.contactItem }, location),
          e(Text, { style: styles.contactItem }, github)
        ),

        e(View, { style: styles.sidebarSection },
          e(Text, { style: styles.sidebarHeading }, "Skills"),
          e(View, { style: styles.skillBlock },
            e(Text, { style: styles.skillCatTitle }, "Domain & Business Logic"),
            e(Text, { style: styles.skillText }, domainSkillsStr)
          ),
          e(View, { style: styles.skillBlock },
            e(Text, { style: styles.skillCatTitle }, "Tools & Engineering"),
            e(Text, { style: styles.skillText }, toolSkillsStr)
          ),
          e(View, { style: styles.skillBlock },
            e(Text, { style: styles.skillCatTitle }, "AI & Automation"),
            e(Text, { style: styles.skillText }, aiSkillsStr)
          )
        ),

        e(View, { style: styles.sidebarSection },
          e(Text, { style: styles.sidebarHeading }, "Education"),
          e(Text, { style: styles.contactItem },
            e(Text, { style: { fontWeight: 'bold', color: '#FFDD50' } }, "B.Tech - Mechanical\n"),
            "VIT University, Vellore (2020)"
          )
        ),

        e(View, { style: styles.sidebarSection },
          e(Text, { style: styles.sidebarHeading }, "Languages"),
          e(Text, { style: styles.contactItem }, "English (TOEFL: 7.5)"),
          e(Text, { style: styles.contactItem }, "Tamil (Native)")
        )
      ),

      /* RIGHT MAIN CONTENT */
      e(View, { style: styles.mainContent },
        /* PROFESSIONAL SUMMARY */
        e(View, { style: styles.section },
          e(Text, { style: styles.sectionHeading }, "Professional Summary"),
          e(Text, { style: styles.summaryText }, summary)
        ),

        /* WORK EXPERIENCE */
        e(View, { style: styles.section },
          e(Text, { style: styles.sectionHeading }, "Work Experience"),
          ...expBlocks
        ),

        /* PROJECTS */
        e(View, { style: styles.section },
          e(Text, { style: styles.sectionHeading }, "Projects"),
          ...projBlocks
        )
      )
    )
  );
};

let inputData = {};
const jsonArg = process.argv[4];

if (jsonArg) {
  try {
    if (fs.existsSync(jsonArg)) {
      inputData = JSON.parse(fs.readFileSync(jsonArg, 'utf8'));
    } else {
      inputData = JSON.parse(jsonArg);
    }
  } catch (err) {
    inputData = { summary: jsonArg };
  }
}

if (!inputData.title && process.argv[2]) {
  inputData.title = process.argv[2];
}

const targetRole = inputData.title || "AI Automation & Business Intelligence Engineer";
const outputPath = process.argv[3] || "output/test_flowcv_openresume.pdf";

console.log(`🚀 Rendering Premium Gemini-Tailored FlowCV OpenResume React PDF to ${outputPath}...`);
renderToFile(FlowCVOpenResumePDFDocument({ data: inputData }), outputPath)
  .then(() => console.log(`✅ Premium Gemini-Tailored FlowCV OpenResume PDF generated successfully: ${outputPath}`))
  .catch((err) => {
    console.error(`❌ OpenResume FlowCV PDF Error:`, err);
    process.exit(1);
  });
