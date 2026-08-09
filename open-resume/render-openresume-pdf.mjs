import React from 'react';
import { renderToFile, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import path from 'path';

const e = React.createElement;

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.3,
    color: '#000000',
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1E3A8A',
    borderBottomStyle: 'solid',
    paddingBottom: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    color: '#2563EB',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
    fontSize: 8.5,
    color: '#374151',
  },
  section: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 9.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#1E3A8A',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
    borderBottomStyle: 'solid',
    paddingBottom: 2,
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 8.5,
    color: '#1F2937',
    lineHeight: 1.3,
  },
  jobBlock: {
    marginBottom: 6,
  },
  jobTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
  },
  companySub: {
    fontSize: 8.5,
    color: '#374151',
    fontStyle: 'italic',
  },
  metaRow: {
    fontSize: 8,
    color: '#2563EB',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  bulletList: {
    marginLeft: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletDot: {
    width: 3,
    height: 3,
    backgroundColor: '#1E3A8A',
    borderRadius: 1.5,
    marginRight: 4,
    marginTop: 3,
  },
  bulletText: {
    fontSize: 8.2,
    color: '#1F2937',
    flex: 1,
    lineHeight: 1.25,
  },
  skillsGrid: {
    flexDirection: 'column',
    gap: 3,
  },
  skillCategory: {
    fontSize: 8.2,
    color: '#1F2937',
  },
  skillCatTitle: {
    fontWeight: 'bold',
    color: '#1E3A8A',
  }
});

const createBullet = (text) => 
  e(View, { style: styles.bulletItem, key: text },
    e(View, { style: styles.bulletDot }),
    e(Text, { style: styles.bulletText }, text)
  );

const OpenResumePDFDocument = ({ targetRole, summary }) => 
  e(Document, { title: "AJAY MARIMUTHU Resume", author: "AJAY MARIMUTHU", producer: "Job-Hunter AI OpenResume Builder" },
    e(Page, { size: "A4", style: styles.page },
      /* HEADER */
      e(View, { style: styles.header },
        e(Text, { style: styles.name }, "AJAY MARIMUTHU"),
        e(Text, { style: styles.title }, targetRole),
        e(View, { style: styles.contactRow },
          e(Text, null, "ajay9f01@gmail.com"),
          e(Text, null, "•"),
          e(Text, null, "+91-9489101583 | +91-7010409697 (WA)"),
          e(Text, null, "•"),
          e(Text, null, "Chennai, India"),
          e(Text, null, "•"),
          e(Text, null, "github.com/ajayf773")
        )
      ),

      /* PROFESSIONAL SUMMARY */
      e(View, { style: styles.section },
        e(Text, { style: styles.sectionHeading }, "Professional Summary"),
        e(Text, { style: styles.summaryText }, summary)
      ),

      /* WORK EXPERIENCE */
      e(View, { style: styles.section },
        e(Text, { style: styles.sectionHeading }, "Work Experience"),
        
        e(View, { style: styles.jobBlock },
          e(Text, { style: styles.jobTitle }, "Merit Data & Technology Pvt. Ltd."),
          e(Text, { style: styles.companySub }, "Senior Research Analyst - Automotive Product Data"),
          e(Text, { style: styles.metaRow }, "03/2022 – 06/2026 | Chennai, India"),
          e(View, { style: styles.bulletList },
            createBullet("Analyzed and validated vehicle specifications from OEM documentation for global automotive databases."),
            createBullet("Identified business opportunities through database traffic analysis, competitor benchmarking, and trim-level differentiation."),
            createBullet("Validated WLTP ranges, CO2 emissions, EV battery specifications, pricing, and optional equipment to maintain high-quality datasets."),
            createBullet("Managed large-scale Excel datasets and resolved data inconsistencies for the UK automotive market.")
          )
        ),

        e(View, { style: styles.jobBlock },
          e(Text, { style: styles.jobTitle }, "SKH Sheet Metal Components Pvt. Ltd."),
          e(Text, { style: styles.companySub }, "Graduate Engineer Trainee"),
          e(Text, { style: styles.metaRow }, "11/2020 – 11/2021 | Chennai, India"),
          e(View, { style: styles.bulletList },
            createBullet("Rotated through multiple shop-floor departments to build a practical understanding of Tier-1 manufacturing workflows."),
            createBullet("Supported daily operations including production monitoring, purchase and dispatch, and quality inspections for sheet metal components.")
          )
        )
      ),

      /* PROJECTS */
      e(View, { style: styles.section },
        e(Text, { style: styles.sectionHeading }, "Projects"),
        e(View, { style: styles.jobBlock },
          e(Text, { style: styles.jobTitle }, "AI-Powered Vehicle Specification ETL Pipeline"),
          e(Text, { style: styles.metaRow }, "2024 – Present"),
          e(View, { style: styles.bulletList },
            createBullet("Built an AI-powered Python ETL pipeline to automatically extract, normalize, validate, and transform structured vehicle specification data from unstructured OEM brochures and technical documentation."),
            createBullet("Integrated Vertex AI Gemini, local LLMs, REST APIs, and semantic AI workflows to automate feature extraction, entity matching, attribute normalization, and validation."),
            createBullet("Reduced a manual workflow from approximately 35 hours to 15 minutes through intelligent automation, significantly improving processing efficiency and data consistency."),
            createBullet("Designed a modular and extensible architecture capable of supporting multiple OEM document formats, scalable validation rules, and future AI model integration.")
          )
        )
      ),

      /* TECHNICAL SKILLS */
      e(View, { style: styles.section },
        e(Text, { style: styles.sectionHeading }, "Technical Skills"),
        e(View, { style: styles.skillsGrid },
          e(Text, { style: styles.skillCategory },
            e(Text, { style: styles.skillCatTitle }, "Domain & Business Logic: "),
            "Vehicle specification analysis, EV & hybrid fundamentals, Trim-level differentiation, Data Validation, Competitive Analysis"
          ),
          e(Text, { style: styles.skillCategory },
            e(Text, { style: styles.skillCatTitle }, "Tools & Engineering: "),
            "Python (Automation & Data Extraction), Power BI & SAP, SQL Database Management, Advanced Excel (Macros, Pivots, Validation)"
          ),
          e(Text, { style: styles.skillCategory },
            e(Text, { style: styles.skillCatTitle }, "AI & Automation: "),
            "Large Language Models (LLMs), Small/Local LLMs, API Integration, Generative AI Automation, Vertex AI / Gemini Enterprise Platform, REST APIs, ETL Pipelines, Workflow Automation"
          )
        )
      ),

      /* EDUCATION & LANGUAGES */
      e(View, { style: styles.section },
        e(Text, { style: styles.sectionHeading }, "Education & Languages"),
        e(Text, { style: styles.summaryText },
          e(Text, { style: { fontWeight: 'bold' } }, "B.Tech - Mechanical Engineering"),
          " — Anna University (2020)  |  ",
          e(Text, { style: { fontWeight: 'bold' } }, "Languages: "),
          "English (TOEFL: 7.5), Tamil (Native)"
        )
      )
    )
  );

const targetRole = process.argv[2] || "AI Automation & Business Intelligence Engineer";
const outputPath = process.argv[3] || "output/test_openresume.pdf";
const summary = "AI Automation & Business Intelligence Engineer with 4+ years of experience designing Python automation, streamlining business processes, and building data-driven solutions. Experienced in developing ETL pipelines, integrating AI and APIs into business workflows, and transforming time-intensive manual operations into scalable automated systems. Passionate about solving real-world business problems through data, automation, and AI.";

console.log(`🚀 Rendering OpenResume React PDF to ${outputPath}...`);
renderToFile(OpenResumePDFDocument({ targetRole, summary }), outputPath)
  .then(() => console.log(`✅ OpenResume React PDF generated successfully: ${outputPath}`))
  .catch((err) => {
    console.error(`❌ OpenResume PDF Error:`, err);
    process.exit(1);
  });
