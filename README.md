# 🎯 Job-Hunter AI — Autonomous Multi-Model Job Hunter Engine

> **An enterprise-grade, open-source AI Job Search & Application Engine powered by parallel multi-provider model balancing, zero-token web scrapers, interactive Playwright form automation, and native Microsoft Excel export.**

---

## 🌟 Key Highlights & Features

### 1. 🤖 Multi-Provider AI Load Balancer (Zero-Token Loss)
- **Multi-API Key Round-Robin**: Rotates requests across multiple API keys simultaneously.
- **Multi-Provider Support**: Built-in support for **Gemini (2.5-Flash, 3.5-Flash, 2.5-Pro)**, **DeepSeek (V3 & R1)**, **Claude (Anthropic)**, **Kimi (Moonshot)**, and **OpenAI**.
- **Smart 429 Cooldown Engine**: Locks rate-limited model pairs for 60 seconds and daily-exhausted keys for 24 hours without failing jobs.
- **Live Health Matrix (`npm run health`)**: Real-time diagnostic terminal UI showing active RPM/RPD stats and model health.

### 2. ⚡ High-Throughput Parallel Worker Pool
- **Concurrent Execution (`npm run eval:parallel`)**: Runs 6+ parallel workers simultaneously, re-evaluating 1,000+ job postings in minutes.
- **Async Failover**: If Worker #1 hits a rate limit, it failovers instantly while Worker #2 through #6 continue at maximum speed.

### 3. 💬 Interactive Chatbot REPL (`npm start`)
- Autonomous terminal helper powered directly by Gemini & Multi-Model APIs.
- Slash commands:
  - `/scan`: Launch high-capacity portal scrapers.
  - `/eval <url>`: Evaluate any job URL instantly.
  - `/apply`: Start interactive Playwright application runner.
  - `/excel`: Export native Excel spreadsheet.
  - `/stats`: View lifetime pipeline analytics.
  - `/health`: Monitor live API key health.

### 4. 📝 Interactive Auto-Apply Assistant (`npm run apply:auto`)
- **Playwright Auto-Fill**: Automates form fields, Q&A inputs, and uploads tailored FlowCV resumes.
- **Multi-Page Redirect Refill**: Press `f` anytime to refill new tabs or redirected application portals.
- **Feedback & Rule Learner**: Input rejection feedback (`r` / `reject`), and the AI automatically appends rules to `modes/_profile.md` to disqualify similar roles in future scans!

### 5. 🔍 High-Capacity Multi-Portal Scrapers (`npm run scan:multi`)
- High-volume job ingestion (up to 300+ jobs per portal) for **LinkedIn**, **Indeed**, **Naukri India**, and **Jobstreet**.
- Explicit error reporting directly in terminal for actor quotas and limits.

### 6. 📊 Native Excel Workbook (`output/Top_Jobs_Analysis.xlsx`)
- Generates a native `.xlsx` workbook featuring:
  - Interactive Status Dropdowns (`Applied`, `Rejected`, `Shortlist`, `Skip`)
  - Clickable Direct Application Portal Links
  - Clickable Tailored 1-Page FlowCV Resume Links
  - Highlighting for Visa Sponsorship & Remote Worldwide roles

---

## 🛠️ Installation & Setup

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

## 🚀 Command Reference

| Command | Purpose |
|---|---|
| `npm start` | Launch the **Job-Hunter AI Interactive REPL Terminal** |
| `npm run health` | View live **API Key & Model Rate-Limit Health Matrix** |
| `npm run scan:multi` | Run **High-Capacity Multi-Portal Scrapers** (LinkedIn, Indeed, Naukri, Jobstreet) |
| `npm run daily` | Run daily automated scan, evaluation, resume, & email pipeline |
| `npm run eval:parallel` | Re-evaluate all scraped jobs using **6 Parallel Concurrent Workers** |
| `npm run apply:auto` | Start **Interactive Playwright Auto-Apply Assistant** |

---

## 🛡️ Data Privacy & Safety

All personal profile data (`cv.md`, `config/profile.yml`, `modes/_profile.md`), API keys (`config/*.json`), evaluation reports (`reports/`), and generated outputs (`output/`) are strictly gitignored in `.gitignore`. Your GitHub repository remains 100% clean and free of private personal data!

---

## 📄 License

MIT License. Built for autonomous job search automation and multi-model AI orchestration.