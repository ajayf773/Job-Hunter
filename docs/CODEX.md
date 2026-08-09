# Codex Guide

job-hunter-ai supports Codex through the same shared router used by the other CLI integrations.

## How Codex maps to job-hunter-ai

- `AGENTS.md` is the shared instruction source.
- Root `CODEX.md` is the thin Codex wrapper that imports `AGENTS.md`.
- This file is the human-facing guide for running job-hunter-ai workflows from Codex.

## Interactive Codex

Start Codex in the repository root:

```bash
cd job-hunter-ai
codex
```

Codex may not expose a native `/job-hunter-ai` slash command. When it does not, ask for the same workflow in plain language:

```text
Evaluate this JD with job-hunter-ai auto-pipeline: https://company.com/jobs/123
Run the job-hunter-ai scan mode and summarize new matches.
Run the job-hunter-ai pipeline mode for data/pipeline.md.
Run the job-hunter-ai pdf mode for the latest evaluated role.
Run the job-hunter-ai email mode for the latest evaluated role. Draft only; never sends, submits, or clicks.
Run the job-hunter-ai tracker mode and summarize the current statuses.
```

## One-shot workers

For single commands or batch workers, use `codex exec`:

```bash
codex exec "Evaluate this JD with job-hunter-ai auto-pipeline: https://company.com/jobs/123"
codex exec "Run job-hunter-ai scan mode in this repo and summarize new matches."
codex exec "Run job-hunter-ai pipeline mode for data/pipeline.md."
codex exec "Run job-hunter-ai pdf mode for the latest evaluated role."
codex exec "Run job-hunter-ai email mode for the latest evaluated role. Draft only; do not send, submit, or click anything."
codex exec "Run job-hunter-ai tracker mode and summarize the current statuses."
```

## Notes

- If your Codex environment exposes slash commands, the shared `/job-hunter-ai` router semantics still apply.
- If it does not, use the same mode names through prompts or `codex exec`.
- Browser-heavy flows such as `scan`, `pipeline`, and `apply` still depend on Playwright browser tools being available in the active agent setup.
