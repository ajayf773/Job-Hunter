#import "template.typ": *

#show: project.with(
  name: "AJAY MARIMUTHU",
  title: "AI Automation & Business Intelligence Engineer",
  email: "ajay9f01@gmail.com",
  phone: "+91-7010409697",
  location: "Chennai, India",
  github: "github.com/ajayf773",
  main: (
    (
      title: "Professional Summary",
      content: [
        AI Automation & Business Intelligence Engineer with 4+ years of experience designing Python automation, streamlining business processes, and building data-driven solutions. Experienced in developing ETL pipelines, integrating AI and APIs into business workflows, and transforming time-intensive manual operations into scalable automated systems.
      ]
    ),
    (
      title: "Experience",
      content: [
        #block(below: 0.8em)[
          #text(weight: "bold")[Senior Research Analyst – Automotive Product Data] \
          #text(style: "italic")[Merit Data & Technology Pvt. Ltd. | Chennai] #h(1fr) #text(fill: rgb("#D78408"))[03/2022 – 06/2026]
          - Analyzed and validated vehicle specification data from OEM documentation for global automotive databases.
          - Maintained high-quality datasets covering WLTP fuel economy/emissions, CO2 emissions, EV battery specs, pricing, and trim-level differentiation.
          - Identified business opportunities through database traffic analysis and competitor benchmarking.
        ]
        #block(below: 0.8em)[
          #text(weight: "bold")[Graduate Engineer Trainee] \
          #text(style: "italic")[SKH Sheet Metal Components Pvt. Ltd. | Chennai] #h(1fr) #text(fill: rgb("#D78408"))[11/2020 – 11/2021]
          - Rotated across manufacturing departments to monitor Tier-1 automotive production workflows and daily operations.
        ]
      ]
    ),
    (
      title: "Projects",
      content: [
        #block(below: 0.8em)[
          #text(weight: "bold")[AI-Powered Vehicle Specification ETL Pipeline] #h(1fr) #text(fill: rgb("#D78408"))[2024 – Present]
          - Built automated Python ETL workflows integrating Vertex AI Gemini, Local LLMs, REST APIs, and semantic AI workflows.
          - Reduced manual processing workflow from approximately *35 hours to 15 minutes*.
          - Designed a modular architecture supporting multiple OEM document formats and scalable validation rules.
        ]
      ]
    )
  ),
  sidebar: (
    (
      title: "Education",
      content: [
        #text(weight: "bold")[B.Tech - Mechanical Engineering] \
        Graduated: 2020
      ]
    ),
    (
      title: "Technical Skills",
      content: [
        #text(weight: "bold")[Domain & Business Logic]
        - Vehicle specification analysis
        - EV & hybrid fundamentals
        - Trim-level differentiation
        - Data Validation
        - Competitive Analysis
        
        #v(4pt)
        #text(weight: "bold")[Tools & Infrastructure]
        - Python (Automation & ETL)
        - SQL Database Management
        - Power BI & SAP
        - Advanced Excel (Macros, Pivot Tables)
        
        #v(4pt)
        #text(weight: "bold")[AI & Automation]
        - Large Language Models (LLMs)
        - Local LLMs & RAG
        - REST API Integration
        - Vertex AI / Gemini Platform
        - Generative AI Automation
      ]
    ),
    (
      title: "Languages",
      content: [
        English (TOEFL: 7.5) | Tamil
      ]
    )
  )
)
