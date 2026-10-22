---
title: Development Log
tags: [mce, log]
updated: 2026-10-21
---

# Development Log

Newest first. Back to [[Home]].

## 2026-10-21
- Added MVP skills for the Expo + Supabase stack, project scope only: Expo plugin, `react-native-testing`, `vercel-react-native-skills`, `vercel-composition-patterns`. Each source was cloned and read first (Markdown only, except Expo's two small helper scripts and hosted MCP server). Supabase skills were already installed globally. Links: [[Architecture#Repository tooling]]
  - Tests: fresh Claude session in this repo lists all new skills; safeguards hook now also asks before `eas build` / `eas deploy` (45/45 cases still pass).
  - Commit/PR: not committed yet.
- Upgraded the quality gate and added CI: `ship.mjs check` now covers integration and browser tests, a secret scan of all changes and a dependency audit, and lists skipped checks explicitly; new wireframe smoke test and GitHub Actions workflow. Links: [[Architecture#Repository tooling]]
  - Tests: `ship.mjs check` → secret scan PASS (36 files), smoke test SKIP locally (needs `--e2e` + Playwright); smoke test run directly with Playwright 1.48.2 → 11 views × 2 widths and 5 flows passed. CI workflow not yet run (not pushed).
  - Commit/PR: not committed yet.
- Set up automatic Obsidian documentation for all repos: this vault is mapped by role in `~/.claude/obsidian/projects.json`; [[Decisions]] note created. Links: [[Decisions]], [[Architecture]]
  - Tests: helper and hook scenarios → 9/9 passed; vault creation for a new repo checked in a sandbox.
  - Commit/PR: not committed yet.
- Configured the Git workflow: feature branches, `ship.mjs` checks and pushes, guard hook, secret-scan and push-guard Git hooks. Links: [[Decisions]], [[Architecture#Repository tooling]]
  - Tests: guard hook → 42/42 cases passed; sandbox end-to-end (secret scan, Claude blocked from pushing `main`/force/delete, feature push, failing checks, auto-push off) → 17/17 passed.
  - Commit/PR: not committed yet. GitHub CLI not installed, so PRs need opening by link until it is.
- Redesigned `wireframe/WF_reference.html` into a dark, minimal design system across every screen; added Account and Design system pages, allocation, recent activity, trade progress steps and confirmations. Links: [[Decisions]], [[Architecture]]
  - Tests: Playwright: all 11 views render with no console errors and no horizontal overflow at 360/390/768/1024/1440px; buy, list, add item, trade send/accept and messaging flows behave as before.
  - Commit/PR: not committed yet.
- Researched price data sources: [[Projects/Collectibles Trading Platform/10 - Price Data Source|10 - Price Data Source]].
- Created this Obsidian vault in `docs/MCE/`.
- Added the startup plan and internal pitch deck in `Projects/Collectibles Trading Platform/` (see [[Projects/Collectibles Trading Platform/Index|Index]]).

## 2026-10-13
- Initial commit: empty scaffold of routes, components and libs, plus `wireframe/WF_reference.html`.
