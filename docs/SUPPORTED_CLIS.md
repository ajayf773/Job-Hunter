# Supported CLIs

job-hunter-ai is AI-agnostic and runs on several command-line agent tools. The core logic is shared via `AGENTS.md`, while CLI-specific nuances are handled through entry wrappers in the repository root.

| CLI | Entry File | How to Invoke |
| --- | --- | --- |
| Claude Code | `CLAUDE.md` | Interactive: `claude` (then `/job-hunter-ai`). Headless/Batch: `claude -p "prompt"` |
| Cursor | `AGENTS.md` | Interactive: open the project in Cursor and ask for `job-hunter-ai` (skill entrypoint at `.cursor/skills/job-hunter-ai/SKILL.md`) |
| Codex | `CODEX.md` (see [`docs/CODEX.md`](CODEX.md)) | Interactive: `codex` (then use plain text). Headless/Batch: `codex exec "prompt"` |
| OpenCode | `OPENCODE.md` | Interactive: `opencode` (then `/job-hunter-ai`). Headless/Batch: `opencode run "prompt"` |
| Antigravity CLI | `AGENTS.md` | Interactive: `agy` (then `/job-hunter-ai`). Headless/Batch: `agy -p "prompt"` |
| Grok Build CLI | `AGENTS.md` | Interactive: `grok` (then `/job-hunter-ai`). Headless/Batch: `grok -p "prompt"` |
| Qwen | `AGENTS.md` | Interactive: `qwen`. Headless/Batch: `qwen -p "prompt"` |
| Kimi | `KIMI.md` | Interactive: `kimi` |
| GitHub Copilot CLI | `AGENTS.md` | Headless/Batch: `copilot -p "prompt"` |
| Gemini | `GEMINI.md` | Legacy wrapper redirecting to `AGENTS.md` (transitioned to Antigravity CLI). |
