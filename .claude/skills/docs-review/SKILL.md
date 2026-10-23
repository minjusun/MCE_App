---
name: docs-review
description: Review the current branch's changes and bring ONBOARDING.md and ARCHITECTURE.md up to date before a pull request. Use when finishing a feature or preparing a PR, or when dependencies, env vars, migrations, auth, integrations, commands, tests, CI or Claude Code config changed.
shell: bash
allowed-tools: Bash(git diff *) Bash(git log *) Bash(git status *) Bash(node scripts/docs-check.mjs *)
---

# Documentation review

## What changed on this branch
```!
git fetch -q origin main 2>/dev/null
echo "--- files changed vs origin/main"; git diff --stat origin/main...HEAD 2>/dev/null | tail -25
echo "--- uncommitted"; git status --short 2>/dev/null | head -15
echo "--- docs check"; node scripts/docs-check.mjs --pr --base origin/main 2>&1
```

## Steps

1. **Classify each change** from the diff above (`git diff origin/main...HEAD -- <file>` for detail). Docs need updating only for:
   - **Setup** → `ONBOARDING.md`: dependencies or runtime versions, env vars (`.env.example`), commands and scripts, test procedures, Supabase setup, Claude Code config (`CLAUDE.md`, `.claude/`), troubleshooting you hit.
   - **Design** → `ARCHITECTURE.md`: tables/RLS/RPCs (migrations), auth, external integrations, routing or data-access patterns, CI and infrastructure, important decisions.
   - **Nothing:** UI tweaks, refactors without new concepts, tests for existing behaviour, copy changes. Don't touch the docs for these.
2. **Edit the affected sections in place.** Keep the status markers (✅ / 🚧 / 📋 / ⚙️) true, and describe what the code does now, not plans. Never write secret values; name env vars only.
3. **Verify every new claim against the repo:** files exist, `npm run` scripts exist in `package.json`, and env vars are in `.env.example`. Run any command you document. Then rerun `node scripts/docs-check.mjs --pr --base origin/main` until it reports no problems.
4. **Obsidian (optional):** if `docs/MCE/` is present, record notable decisions in `docs/MCE/Decisions.md` and a dated entry in `docs/MCE/Development-Log.md`. The repo docs stay the source of truth.
5. **PR description:** tick the matching box under **Documentation** in the template. If no update was needed, tick "No documentation changes needed" and give the reason.

## Report
In a few lines: docs updated (sections), anything you couldn't verify (e.g. macOS-only or Docker steps), and the final docs-check result.
