import React from 'react';
import { renderToFile, Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

const e = React.createElement;

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.2,
  },
  /* LEFT SIDEBAR (Dark Slate) */
  sidebar: {
    width: '32%',
    backgroundColor: '#2D3748',
    color: '#FFFFFF',
    padding: 16,
    flexDirection: 'column',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFDD50',
    marginBottom: 4,
    lineHeight: 1.1,
  },
  title: {
    fontSize: 10.5,
    color: '#E2E8F0',
    marginBottom: 14,
    fontWeight: 'bold',
  },
  sidebarSection: {
    marginBottom: 14,
  },
  sidebarHeading: {
    fontSize: 9.5,
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
    marginBottom: 4,
    lineHeight: 1.25,
  },
  skillCategory: {
    fontSize: 8,
    color: '#EDF2F7',
    marginBottom: 4,
    lineHeight: 1.25,
  },
  skillTitle: {
    fontWeight: 'bold',
    color: '#FFDD50',
  },

  /* RIGHT MAIN CONTENT */
  mainContent: {
    width: '68%',
    padding: 18,
    flexDirection: 'column',
  },
  section: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 10,
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
    marginBottom: 8,
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
    marginBottom: 2.5,
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

const createBullet = (text) => 
  e(View, { style: styles.bulletItem, key: text },
    e(View, { style: styles.bulletDot }),
    e(Text, { style: styles.bulletText }, text)
  );

const FlowCVOpenResumePDFDocument = ({ targetRole, summary }) => 
  e(Document, { title: "AJAY MARIMUTHU Resume", author: "AJAY MARIMUTHU", producer: "Job-Hunter AI OpenResume FlowCV Builder" },
    e(Page, { size: "A4", style: styles.page },
      /* LEFT SIDEBAR */
      e(View, { style: styles.sidebar },
        e(Text, { style: styles.name }, "AJAY MARIMUTHU"),
        e(Text, { style: styles.title }, targetRole),
        
        e(View, { style: styles.sidebarSection },
          e(Text, { style: styles.sidebarHeading }, "Contact"),
          e(Text, { style: styles.contactItem }, "ajay9f01@gmail.com"),
          e(Text, { style: styles.contactItem }, "+91-9489101583"),
          e(Text, { style: styles.contactItem }, "+91-7010409697 (WA)"),
          e(Text, { style: styles.contactItem }, "Chennai, India"),
          e(Text, { style: styles.contactItem }, "github.com/ajayf773")
        ),

        e(View, { style: styles.sidebarSection },
          e(Text, { style: styles.sidebarHeading }, "Skills"),
          e(Text, { style: styles.skillCategory },
            e(Text, { style: styles.skillTitle }, "Domain & Data: "),
            "Vehicle Specs, EV/Hybrid Data, Trim Differentiation, Validation"
          ),
          e(Text, { style: styles.skillCategory },
            e(Text, { style: styles.skillTitle }, "Tools: "),
            "Python, Power BI, SAP, SQL, Advanced Excel, Macros"
          ),
          e(Text, { style: styles.skillCategory },
            e(Text, { style: styles.skillTitle }, "AI & Automation: "),
            "LLMs, Gemini / Vertex AI, REST APIs, ETL Pipelines, Generative AI"
          )
        ),

        e(View, { style: styles.sidebarSection },
          e(Text, { style: styles.sidebarHeading }, "Education"),
          e(Text, { style: styles.contactItem },
            e(Text, { style: { fontWeight: 'bold', color: '#FFDD50' } }, "B.Tech - Mechanical\n"),
            "Anna University (2020)"
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
        )
      )
    )
  );

const targetRole = process.argv[2] || "AI Automation & Business Intelligence Engineer";
const outputPath = process.argv[3] || "output/test_flowcv_openresume.pdf";
const summary = "AI Automation & Business Intelligence Engineer with 4+ years of experience designing Python automation, streamlining business processes, and building data-driven solutions. Experienced in developing ETL pipelines, integrating AI and APIs into business workflows, and transforming time-intensive manual operations into scalable automated systems. Passionate about solving real-world business problems through data, automation, and AI.";

console.log(`🚀 Rendering Exact FlowCV Styled OpenResume React PDF to ${outputPath}...`);
renderToFile(FlowCVOpenResumePDFDocument({ targetRole, summary }), outputPath)
  .then(() => console.log(`✅ Exact FlowCV Styled OpenResume PDF generated successfully: ${outputPath}`))
  .catch((err) => {
    console.error(`❌ OpenResume FlowCV PDF Error:`, err);
    process.exit(1);
  });
