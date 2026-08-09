# Setup Guide

## Prerequisites

- An AI coding CLI — [Claude Code](https://claude.ai/code), Gemini CLI, Codex, Qwen Code, OpenCode, GitHub Copilot CLI, Antigravity CLI, or Grok Build CLI (see [Supported CLIs](SUPPORTED_CLIS.md))
- [Node.js](https://nodejs.org) 18+ and `git` (`npx` ships with Node — the installer refuses to run without them) — note: the Gemini CLI integration requires Node.js 20+
- (Optional) Go 1.21+ (for the dashboard TUI)

## Quick Start

### Recommended — one command

```bash
npx @santifer/job-hunter-ai init
```

`npx` ships with Node.js — it runs the installer once without installing anything globally. This clones the latest release into `./job-hunter-ai` and installs dependencies. Then move into the workspace and open your AI CLI:

```bash
cd job-hunter-ai
claude   # or codex / qwen / opencode / agy / grok
```

**On first launch, job-hunter-ai walks you through setup by chatting** — it asks for your CV, your details (name, target roles, salary), and sets up the job scanner with pre-configured companies. Nothing to edit by hand: just answer its questions. Then paste a job offer URL or description and it evaluates it, writes a report, generates a tailored PDF, and tracks it.

If you are using Codex, start the interactive session with `codex`. Slash commands are not guaranteed in Codex, so use the same mode names in a prompt if `/job-hunter-ai` is unavailable:

```text
Evaluate this JD with job-hunter-ai auto-pipeline: https://company.com/jobs/123
Run the job-hunter-ai scan mode.
Run the job-hunter-ai pipeline mode.
Run the job-hunter-ai pdf mode.
Run the job-hunter-ai email mode for the latest evaluated role. Draft only; never sends, submits, or clicks.
Run the job-hunter-ai tracker mode.
```

For one-shot workers or batch tasks in Codex, use `codex exec`. See [docs/CODEX.md](CODEX.md) for the full guide.

```bash
codex exec "Evaluate this JD with job-hunter-ai auto-pipeline: https://company.com/jobs/123"
codex exec "Run job-hunter-ai scan mode in this repo."
codex exec "Run job-hunter-ai pipeline mode for data/pipeline.md."
codex exec "Run job-hunter-ai pdf mode for the latest evaluated role."
codex exec "Run job-hunter-ai email mode for the latest evaluated role. Draft only; do not send, submit, or click anything."
codex exec "Run job-hunter-ai tracker mode and summarize the current statuses."
```

### Advanced — clone manually

<details>
<summary>Prefer to clone the repo yourself?</summary>

```bash
git clone https://github.com/santifer/job-hunter-ai.git
cd job-hunter-ai
npm install
```

Then open your AI CLI in the folder — the same first-run onboarding applies. Use this path if you want to track a specific branch, contribute, or audit the code before installing dependencies.

</details>

### PDF rendering (one-time)

PDFs are rendered with a headless Chromium. Install it once per machine:

```bash
npx playwright install chromium
```

## Available Commands

| Action | How |
|--------|-----|
| Evaluate an offer | Paste a URL or JD text |
| Search for offers | `/job-hunter-ai scan` or ask the agent to run `scan` |
| Process pending URLs | `/job-hunter-ai pipeline` or ask the agent to run `pipeline` |
| Generate a PDF | `/job-hunter-ai pdf` or ask the agent to run `pdf` |
| Draft application email | `/job-hunter-ai email` or ask the agent to run `email`; draft-only, never sends, submits, or clicks |
| Batch evaluate | `/job-hunter-ai batch` or use `codex exec "Run job-hunter-ai batch mode ..."` |
| Check tracker status | `/job-hunter-ai tracker` or ask the agent to run `tracker` |
| Fill application form | `/job-hunter-ai apply` or ask the agent to run `apply` |

## Verify Setup

```bash
node cv-sync-check.mjs      # Check configuration
node verify-pipeline.mjs     # Check pipeline integrity
```

## Build Dashboard (Optional)

```bash
npm run serve:dashboard     # Opens TUI pipeline viewer
npm run build:dashboard     # Optional: build the standalone binary
```
