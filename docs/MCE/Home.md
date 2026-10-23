---
title: MCE — Home
tags: [moc, mce]
updated: 2026-10-21
---

# MCE — Project Home

A mobile app (working title **BINDER**: "collect, trade, sell") for collectors to track a portfolio, browse a shop, keep a wishlist, trade with other collectors and message them. The UI reference is `wireframe/WF_reference.html`.

> [!info] Status legend used across these notes
> - ✅ **Implemented**: in the codebase on `main`
> - 🚧 **In progress**: partially built
> - 📋 **Planned**: on the [[Roadmap]], not started
> - 💡 **Idea**: unscheduled; lives in [[Ideas]]

## Current state

> [!important] Source of truth
> Setup and the actual implementation are documented in the repo: `ONBOARDING.md` and `ARCHITECTURE.md` at the repository root. This vault keeps product notes, decisions and the development log; if a note disagrees with the repo docs or the code, the repo wins.

The repo is scaffolded: the route, component and library files exist but are empty, so no app feature is implemented yet.

| Area | Status |
| --- | --- |
| Expo app (SDK 58): routes, navigation, typed Supabase client, lint/types/tests/build | 🚧 Running with placeholder screens. See [[Architecture]] |
| Supabase database: schema, RLS, tests | ✅ Merged (PR #2); 129 tests pass on Supabase Postgres 17 in CI. Applied to the shared dev project. See [[Database]] |
| Clickable wireframe with dark design system | ✅ Redesigned 2026-10-21 (uncommitted) |
| Git workflow: feature branches, checks, guarded pushes, PRs | ✅ Set up 2026-10-21 (uncommitted) |
| Price data source | 🚧 Researching; see [[Projects/Collectibles Trading Platform/10 - Price Data Source|Price Data Source]] |

## Notes

- [[Architecture]]: file structure, screen map and repo tooling
- [[Database]]: schema, ER diagram, RLS, migrations and setup for both developers
- [[Decisions]]: design system, Git workflow, docs and database decisions
- [[Roadmap]]: order of work
- [[Development-Log]]: dated history of changes
- [[Ideas]]: unscheduled ideas
- [[Projects/Collectibles Trading Platform/Index|Collectibles Trading Platform]]: startup plan and internal pitch deck
