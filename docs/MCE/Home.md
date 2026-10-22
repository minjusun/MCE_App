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

The repo is scaffolded: the route, component and library files exist but are empty, so no app feature is implemented yet.

| Area | Status |
| --- | --- |
| Expo app screens | 📋 Planned (files empty) |
| Supabase database: schema, RLS, tests | 🚧 Migration written and tested; not yet applied to the shared dev project. See [[Database]] |
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
