# 🎯 Job-Hunter AI — Autonomous Multi-Model Job Hunter Engine

> **An enterprise-grade, open-source AI Job Search & Application Engine powered by parallel multi-provider model balancing, zero-token web scrapers, interactive Playwright form automation, and native Microsoft Excel export.**

---

## 🌟 What Is Job-Hunter AI?

**Job-Hunter AI** turns any AI coding CLI (Antigravity CLI, Claude Code, Codex, OpenCode, Qwen, Kimi, Copilot, Grok) or standalone Node.js environment into a complete, high-throughput job search command center.

Instead of manually browsing hundreds of job boards or filling out repetitive forms:
- **Evaluates Fit by Reasoning**: Scores job descriptions against your experience across weighted dimensions, filtering out deal-breakers (e.g. no visa sponsorship, mandatory non-English fluency) before they reach your list.
- **Generates Tailored Resumes**: Creates ATS-optimized, 1-page FlowCV PDF resumes tailored specifically to each role.
- **Scans High-Volume Job Portals**: Ingests up to 300+ postings per source across LinkedIn, Indeed, Naukri (India), and Jobstreet (SE Asia).
- **Automates Application Forms**: Interactive Playwright form filler auto-populates candidate details, answers custom Q&A fields, and attaches tailored PDF resumes.
- **Learns From Rejections**: Type rejection feedback (`r` / `reject`), and the system automatically updates `modes/_profile.md` to permanently disqualify similar roles in future runs.
- **Exports Native Microsoft Excel Spreadsheets**: Creates `.xlsx` workbooks featuring interactive status dropdowns, direct portal links, and resume download links.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🤖 **Multi-Provider AI Load Balancer** | Round-robins across multiple API keys & models (**Gemini 2.5/3.5**, **Claude**, **DeepSeek**, **Kimi**, **OpenAI**). Smart 60s RPM & 24h RPD rate-limit failover. |
| ⚡ **6-Worker Parallel Engine** | Evaluates 1,000+ scraped jobs simultaneously in parallel (`npm run eval:parallel`). |
| 🌐 **Work Authorization & Location Filter** | Automatically flags non-sponsorship roles and prioritizes Remote-Worldwide or Visa Sponsorship postings based on user profile settings. |
| 📝 **Interactive Auto-Apply Assistant** | Step-by-step Playwright form automation (`npm run apply:auto`) with multi-page redirect fill (`f`) and live rejection learning (`r`). |
| 💬 **Interactive Terminal Assistant** | Autonomous terminal chatbot (`npm start`) with slash commands (`/scan`, `/eval`, `/apply`, `/excel`, `/stats`, `/health`). |
| 📊 **Native Excel & CSV Exporter** | Generates `output/Top_Jobs_Analysis.xlsx` with interactive dropdowns, direct portal links, and tailored resume links. |
| 🔍 **High-Capacity Scrapers** | Multi-account Apify scrapers (`npm run scan:multi`) for LinkedIn, Indeed, Naukri, and Jobstreet with limit 300+. |
| 📈 **API Health Matrix** | Terminal UI (`npm run health`) displaying real-time RPM/RPD usage and model health across all API keys. |

---

## 🛠️ Quick Start

```bash
# 1. Clone your repository
git clone https://github.com/ajayf773/Job-Hunter.git
cd Job-Hunter

# 2. Install dependencies
npm install

# 3. Configure API Keys in config/api-keys.json
mkdir -p config
```

### Config File: `config/api-keys.json`
```json
{
  "gemini": [
    "AIzaSyD2...",
    "AIzaSyB3...",
    "AIzaSyC4..."
  ],
  "claude": "sk-ant-api03-...",
  "deepseek": "sk-...",
  "kimi": "sk-...",
  "apify": {
    "linkedin": "apify_api_...",
    "indeed": "apify_api_...",
    "naukri": "apify_api_...",
    "indonesia": "apify_api_..."
  }
}
```

---

## 💻 Command Reference

| Command | Purpose |
|---|---|
| `npm start` | Launch the **Job-Hunter AI Interactive REPL Terminal** |
| `npm run health` | View live **API Key & Model Rate-Limit Health Matrix** |
| `npm run scan:multi` | Run **High-Capacity Multi-Portal Scrapers** (LinkedIn, Indeed, Naukri, Jobstreet) |
| `npm run eval:parallel` | Re-evaluate all scraped jobs using **6 Parallel Concurrent Workers** |
| `npm run apply:auto` | Start **Interactive Playwright Auto-Apply Assistant** |
| `npm run daily` | Run daily automated scan, evaluation, resume, & email pipeline |
| `npm run doctor` | Run system prerequisite & file contract diagnostic check |

---

## 🛡️ Data Privacy & Security Guarantee

Your privacy is built into the core architecture:
- All personal profile data (`cv.md`, `config/profile.yml`, `modes/_profile.md`), API keys (`config/*.json`), evaluation reports (`reports/`), and generated outputs (`output/`) are **strictly gitignored** in `.gitignore`.
- Your GitHub repository remains 100% clean and free of private personal data.

---

## 📄 License

MIT License. Built for autonomous job search automation, multi-model AI orchestration, and candidate empowerment.