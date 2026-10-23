---
title: Development Log
tags: [mce, log]
updated: 2026-10-21
---

# Development Log

Newest first. Back to [[Home]].

## 2026-10-23
- Expo SDK 58 app set up on the existing layout: root and tab layouts, placeholder screens for all 14 routes, design tokens, typed Supabase client, generated `types/database.ts`, money and portfolio maths with tests. Quality gate now real: lint, type check, unit tests, web build, audit (with reviewed exceptions). Links: [[Architecture]], [[Decisions]]
  - Tests: `ship.mjs check --e2e` → 7 PASS (lint, types, 9 Jest tests, web build of all routes, audit, 129 DB tests, secret scan), 1 SKIP (wireframe smoke test: Playwright not installed locally; runs in CI). App clicked through on localhost:8081 at 1280px and 390px: all four tabs and a product route render, no console errors.
  - Commit/PR: branch `feat/expo-app`; PR link added when opened.
- PR #2 (database foundation) merged; CI ran all 129 pgTAP tests on Supabase Postgres 17 (pass) and the advisors (0 security findings, 2 performance warnings about overlapping read policies). Applying it to the shared dev project is pending the Supabase CLI login.

## 2026-10-22
- Database foundation for the MVP: Supabase CLI project, migration `20261022020652_mvp_schema` (7 tables, RLS on all, explicit Data API grants, trade transition rules), pgTAP tests, PGlite runner and a Database CI workflow. Not applied to the shared dev project. Links: [[Database]], [[Decisions]]
  - Review: `security-auditor` (no critical/high; 3 medium, 5 low) and `code-reviewer` (1 blocking: the test runner could report PASS with no tests; 6 should-fix). All fixed: trade terms locked at creation via `propose_trade`, holdings deletable after finished trades, costs can't follow ownership changes, one counter per trade, offer limit, unique raw/sealed variants, column-level grants, quantity guard, inbox indexes.
  - Tests: `npm run test:db` → 129/129 passed (PGlite, Postgres 18.6). Mutation check: 18/18 deliberately broken rules caught. Supabase-image CI run: pending on the PR.
  - Commit/PR: on branch `feat/db-foundation`; link added when the PR exists.

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
