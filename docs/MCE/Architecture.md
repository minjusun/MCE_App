---
title: Architecture
tags: [mce, architecture]
updated: 2026-10-21
---

# Architecture

Expo Router–style file layout (`app/` routes, `(tabs)` group), with Supabase as the backend (`lib/supabase.ts`). The database schema, security model and migration workflow are in [[Database]]. Back to [[Home]].

## Screens (all 📋 planned, files empty)

Screen names follow the redesigned wireframe (2026-10-21); see [[Decisions]] for the design system.

| Route file | Screen (from wireframe) |
| --- | --- |
| `app/_layout.tsx` | Root layout |
| `app/(auth)/login.tsx` | Login (not in the wireframe yet) |
| `app/(tabs)/_layout.tsx` | Tab bar: Overview, Market, Add, Portfolio, Trades |
| `app/(tabs)/index.tsx` | Overview: summary figures, performance chart, needs attention, allocation, top holdings, recent activity, under-market and trending listings |
| `app/(tabs)/portfolio.tsx` | Portfolio: value chart, allocation by type and game, holdings table/grid |
| `app/(tabs)/shop.tsx` | Market: for sale / wanted |
| `app/(tabs)/trades.tsx` | Trades: incoming, sent, history, with progress steps |
| `app/search.tsx` | Search |
| `app/wishlist.tsx` | Wishlist |
| `app/product/[id].tsx` | Product detail |
| `app/user/[handle].tsx` | Collector profile: binder, looking for |
| `app/trade/new.tsx` | New trade: you give / you get |
| `app/messages/index.tsx` | Messages list |
| `app/messages/[threadId].tsx` | Message thread |

## Shared code

| File | Purpose |
| --- | --- |
| `components/CardTile.tsx`, `ItemRow.tsx`, `ListingCard.tsx`, `PortfolioChart.tsx` | UI components |
| `constants/theme.ts` | Theme tokens |
| `lib/format.ts`, `lib/pricing.ts` | Formatting and pricing helpers |
| `lib/supabase.ts` | Supabase client |
| `types/index.ts` | Shared types |

Wireframe screens with no route file yet: **Account** (profile, public binder setting, wallet) and **Design system** (token and component reference).

## Repository tooling

| Path | Purpose |
| --- | --- |
| `wireframe/WF_reference.html` | Clickable single-file prototype with sample data; holds the design tokens |
| `CLAUDE.md` | Project instructions for Claude Code, including the Git workflow |
| `.claude/settings.json`, `.claude/hooks/git-guard.mjs` | Claude Code permissions and the hook that enforces the Git workflow |
| `.claude/scripts/ship.mjs` | Quality gate (lint, types, unit/integration tests, build, secret scan, dependency audit; `--e2e` for browser tests), then pushes a feature branch and opens or updates its PR |
| `.claude/checks.json` | Repo-specific extra checks: the wireframe smoke test |
| `tests/wireframe-smoke.mjs` | Playwright smoke test: 11 views at 360 and 1440px, plus accept-trade, add, list, buy and send-offer flows |
| `.github/workflows/claude-checks.yml`, `.claude/ci-setup.sh` | CI on every PR and push to `main`: the same `ship.mjs check --e2e` (installs Playwright first) |
| `.githooks/` | Git hooks (enabled via `core.hooksPath`): secret scan on commit, push guard for Claude |
| `docs/MCE/` | This Obsidian vault |
| `supabase/config.toml`, `supabase/migrations/` | Supabase CLI project (Postgres 17) and version-controlled schema migrations; see [[Database]] |
| `supabase/tests/database/` | pgTAP tests: schema, constraints, RLS, trades. Run with `npm run test:db` (PGlite) or `npx supabase test db` |
| `scripts/db-test/` | PGlite test runner plus a small stand-in for Supabase's auth schema and roles |
| `.github/workflows/database.yml` | CI on Supabase's Postgres image: migrations, pgTAP tests, advisors, type check |
| `package.json` | Dev tooling only so far (pinned Supabase CLI, PGlite); the Expo app will add to it |
| `.claude/skills/`, `skills-lock.json` | Project skills: `react-native-testing` (from callstack/react-native-testing-library), `vercel-react-native-skills`, `vercel-composition-patterns` (from vercel-labs/agent-skills). Update with `npx skills update` |
| `.claude/settings.json` → `enabledPlugins` | Expo's official plugin (`expo@claude-plugins-official`, project scope): 24 Expo/EAS skills and Expo's hosted MCP server |

These files come from the reusable kit in `~/.claude/repo-kit` (update with `node ~/.claude/repo-kit/install.mjs --update`). No `package.json` exists yet, so lint, type check, unit tests and build are reported as skipped; the secret scan always runs and the smoke test runs with `--e2e` or in CI.
