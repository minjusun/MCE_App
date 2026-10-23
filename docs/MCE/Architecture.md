---
title: Architecture
tags: [mce, architecture]
updated: 2026-10-23
---

# Architecture

> [!important] Source of truth
> Setup and the actual implementation are documented in the repo: `ONBOARDING.md` and `ARCHITECTURE.md` at the repository root. This note adds detail on screens and tooling; `ARCHITECTURE.md` wins on any conflict.

Expo SDK 58 app (React Native 0.88, React 19.3, TypeScript 6, Expo Router) with Supabase as the backend (`lib/supabase.ts`). Routes live in `app/` at the repo root (kept from the original scaffold rather than moving to `src/app/`); `@/*` imports resolve from the repo root. Navigators come from `expo-router/stack` and `expo-router/js-tabs` (the root `Tabs` export is deprecated in SDK 58). Runs on web, iOS and Android; `npm run web` serves it on localhost:8081. The database schema, security model and migration workflow are in [[Database]]. Back to [[Home]].

## Screens (🚧 routes exist as placeholders)

Every route renders a placeholder (`components/Screen` with a "Planned" note) so navigation works end to end; the real screens follow the redesigned wireframe (2026-10-21, see [[Decisions]]).

| Route file | Screen (from wireframe) |
| --- | --- |
| `app/_layout.tsx` | Root layout |
| `app/(auth)/login.tsx` | Login (not in the wireframe yet) |
| `app/(tabs)/_layout.tsx` | Tab bar: Overview, Market, Portfolio, Trades (the wireframe's Add button is 📋 planned) |
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
| `components/Screen.tsx` | ✅ Page shell (title, subtitle, planned note), with RNTL test |
| `components/CardTile.tsx`, `ItemRow.tsx`, `ListingCard.tsx`, `PortfolioChart.tsx` | 📋 Empty placeholders for the wireframe components |
| `constants/theme.ts` | ✅ Design tokens from the wireframe (colours, radii, spacing, type) |
| `lib/format.ts` | ✅ Money and percent formatting, with tests |
| `lib/pricing.ts` | ✅ Portfolio value, cost basis and profit/loss in exact cents, with tests |
| `lib/supabase.ts` | ✅ Typed Supabase client, created on first use; session stored with `expo-sqlite` localStorage as the Expo docs recommend |
| `types/database.ts` | ✅ Generated from the schema (`npm run db:types`); CI fails if it drifts |
| `types/index.ts` | ✅ App aliases (`Holding`, `Listing`, `Trade`, …) |

Wireframe screens with no route file yet: **Account** (profile, public binder setting, wallet) and **Design system** (token and component reference).

## Repository tooling

| Path | Purpose |
| --- | --- |
| `wireframe/WF_reference.html` | Clickable single-file prototype with sample data; holds the design tokens |
| `CLAUDE.md` | Project instructions for Claude Code, including the Git workflow |
| `.claude/settings.json`, `.claude/hooks/git-guard.mjs` | Claude Code permissions and the hook that enforces the Git workflow |
| `.claude/scripts/ship.mjs` | Quality gate (lint, types, unit/integration tests, build, secret scan, dependency audit; `--e2e` for browser tests), then pushes a feature branch and opens or updates its PR |
| `.claude/checks.json` | Repo-specific extra checks: database tests, wireframe smoke test |
| `.claude/scripts/audit.mjs`, `.claude/audit-allowlist.json` | Dependency audit: fails on high/critical advisories in production dependencies except reviewed, expiring exceptions |
| `app.json`, `tsconfig.json`, `eslint.config.js` | Expo config (name BINDER, dark UI, web static output), strict TypeScript, Expo ESLint flat config (app code only) |
| `tests/wireframe-smoke.mjs` | Playwright smoke test: 11 views at 360 and 1440px, plus accept-trade, add, list, buy and send-offer flows |
| `.github/workflows/claude-checks.yml`, `.claude/ci-setup.sh` | CI on every PR and push to `main`: the same `ship.mjs check --e2e` (installs Playwright first) |
| `.githooks/` | Git hooks (enabled via `core.hooksPath`): secret scan on commit, push guard for Claude |
| `docs/MCE/` | This Obsidian vault |
| `supabase/config.toml`, `supabase/migrations/` | Supabase CLI project (Postgres 17) and version-controlled schema migrations; see [[Database]] |
| `supabase/tests/database/` | pgTAP tests: schema, constraints, RLS, trades. Run with `npm run test:db` (PGlite) or `npx supabase test db` |
| `scripts/db-test/` | PGlite test runner plus a small stand-in for Supabase's auth schema and roles |
| `.github/workflows/database.yml` | CI on Supabase's Postgres image: migrations, pgTAP tests, advisors, type check |
| `package.json` | Expo app plus scripts: `start`, `web`, `lint`, `typecheck`, `test` (Jest 30 + jest-expo + React Native Testing Library 14), `build` (web export), `test:db`, `db:types` |
| `.claude/skills/`, `skills-lock.json` | Project skills: `react-native-testing` (from callstack/react-native-testing-library), `vercel-react-native-skills`, `vercel-composition-patterns` (from vercel-labs/agent-skills). Update with `npx skills update` |
| `.claude/settings.json` → `enabledPlugins` | Expo's official plugin (`expo@claude-plugins-official`, project scope): 24 Expo/EAS skills and Expo's hosted MCP server |

These files come from the reusable kit in `~/.claude/repo-kit` (update with `node ~/.claude/repo-kit/install.mjs --update`). `ship.mjs check` runs lint, type check, unit tests, web build, dependency audit, database tests and the secret scan; the wireframe smoke test runs with `--e2e` (CI always does).
