# Onboarding

How to set up, run and contribute to **BINDER**, the collectibles trading marketplace MVP. This file and [ARCHITECTURE.md](ARCHITECTURE.md) are the source of truth for setup and design; keep them current (see [Keeping these docs current](#10-keeping-these-docs-current)).

Status markers: ✅ implemented · 🚧 in progress · 📋 planned · ⚙️ needs manual setup on your machine

## 1. Project overview

BINDER helps Pokémon collectors track a portfolio, buy and sell on a marketplace, and trade cards with each other. MVP scope:

| Area | Status |
| --- | --- |
| App shell: navigation and placeholder screens for every route | ✅ |
| Database: schema, Row Level Security, trade rules, tests | ✅ in `supabase/migrations/`; 🚧 not yet applied to the shared dev project |
| Typed Supabase client (`lib/supabase.ts`) | ✅ configured, not yet used by any screen |
| Portfolio maths (`lib/pricing.ts`) and formatting (`lib/format.ts`) | ✅ with unit tests |
| Portfolio, marketplace and trading screens | 📋 placeholders only; the design is in `wireframe/WF_reference.html` |
| Sign-in (Supabase Auth) | 📋 not implemented |
| Market price data | 📋 not integrated (provider still being chosen) |
| Payments, escrow, shipping, deployment | 📋 out of MVP scope / not configured |

## 2. Technology stack

| | Version | Notes |
| --- | --- | --- |
| Expo SDK | ~58.0.17 | React Native 0.88, React 19.3, Expo Router ~58 |
| TypeScript | ~6.0.3 | `strict`; `@/*` imports resolve from the repo root |
| Supabase | `@supabase/supabase-js` 2.118.0 (pinned) | Postgres 17 on the hosted project |
| Supabase CLI | 2.121.0 (dev dependency) | run it with `npx supabase …`; no global install needed |
| Node.js | 22 LTS (see `.nvmrc`) | CI uses 22; Node 24 also works |
| npm | 10 or later | the lockfile is `package-lock.json`; don't use yarn/pnpm |
| Tests | Jest 30 + jest-expo + React Native Testing Library 14; pgTAP for the database | |
| Lint | ESLint 9 with `eslint-config-expo` | |

## 3. First-time setup

Commands work the same in macOS Terminal (zsh), Git Bash and PowerShell unless noted.

1. **Install prerequisites:** Git, Node.js 22 LTS ([nodejs.org](https://nodejs.org) or `nvm use`), and optionally the GitHub CLI (`gh`). Docker is only needed for a *local* Supabase stack (see [section 6](#6-database-supabase)).
2. **Clone and install:**
   ```bash
   git clone https://github.com/minjusun/MCE_App.git
   cd MCE_App
   npm ci
   ```
3. ⚙️ **Turn on the repo's Git hooks** (once per clone). They block commits that contain secrets:
   ```bash
   git config core.hooksPath .githooks
   ```
4. ⚙️ **Create your `.env`** from the template, then fill it in (see [section 5](#5-environment-variables)). `.env` is git-ignored; never commit it.
   - macOS / Git Bash: `cp .env.example .env`
   - PowerShell: `Copy-Item .env.example .env`
5. **Check everything works:**
   ```bash
   node .claude/scripts/ship.mjs check
   ```
   Expect PASS for lint, type check, unit tests, build, dependency audit, database tests and secret scan, and SKIP for the wireframe smoke test (see [section 8](#8-testing-and-debugging)).

## 4. Running the app

| Command | What it does |
| --- | --- |
| `npm run web` | Dev server in the browser at http://localhost:8081 |
| `npm start` | Dev server; scan the QR code with **Expo Go** on a phone (same Wi-Fi) |
| `npm run ios` / `npm run android` | Open in the iOS simulator (macOS + Xcode only) or the Android emulator (Android Studio) |
| `npm run build` | Static web export into `dist/` (what CI builds) |

The app runs without a `.env`: screens are placeholders and the Supabase client is only created on first use.

The HTML prototype (`wireframe/WF_reference.html`) is the design reference. Open the file directly in a browser; it needs no server or install.

## 5. Environment variables

All variables are listed in `.env.example`. Ask your partner for the shared dev project values, or copy them from the Supabase dashboard (Project Settings → API Keys / General). Never paste them into issues, PRs, chat or docs.

| Variable | Used by | Needed for |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | the app | talking to Supabase |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the app | talking to Supabase. Publishable key only; it's bundled into the app and safe because RLS protects the data |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI | linking and pushing migrations. Use a **scoped** personal access token limited to this project |
| `SUPABASE_PROJECT_REF` | Supabase CLI, Claude Code | `supabase link`, and the Supabase MCP server in `.mcp.json`. For Claude Code it must be set in your shell, not only in `.env` (see [Claude Code](#claude-code-optional-shared-through-the-repo)) |
| `SUPABASE_DB_PASSWORD` | Supabase CLI | `supabase db push` |

Only `EXPO_PUBLIC_` variables reach the app, and everything with that prefix is public. The service-role (secret) key must never appear in the app, `.env.example`, the repo or the docs.

## 6. Database (Supabase)

The schema, RLS policies and trade rules are in `supabase/migrations/`; the design is in [ARCHITECTURE.md](ARCHITECTURE.md#database).

- ✅ **Test without Docker:** `npm run test:db` runs every migration and all pgTAP tests in PGlite (Postgres compiled to WebAssembly).
- ⚙️ **Shared dev project:** link once per machine:
  ```bash
  npx supabase login            # opens a browser; or set SUPABASE_ACCESS_TOKEN
  npx supabase link --project-ref <your SUPABASE_PROJECT_REF>
  ```
- **Changing the schema:**
  1. `npx supabase migration new <name>` creates a timestamped file in `supabase/migrations/`. Never edit a migration that has already been applied; add a new one.
  2. Write the SQL and add tests in `supabase/tests/database/`, then run `npm run test:db`.
  3. Open a PR. CI runs the tests on Supabase's own Postgres image, runs the security advisors, and checks that `types/database.ts` matches the schema.
  4. After merging, **one** of you applies it: `npx supabase db push --dry-run`, then `npx supabase db push`. Never change the schema in the dashboard.
- **Database types:** `types/database.ts` is generated. `npm run db:types` regenerates it but needs a local Supabase stack (`npx supabase start`, which requires Docker). Without Docker, download the `database-types` artifact from the PR's **Database** workflow run.
- 🚧 The schema is merged but **not yet applied** to the shared dev project.

## 7. Authentication and external services

- 📋 **Sign-in** is not implemented. The plan is Supabase Auth; the database already ties every row to `auth.uid()`. There is nothing to configure yet.
- 📋 **Market price data** is not integrated. Research on providers is in the Obsidian vault (`docs/MCE/`). There are no API keys to set up.
- No other external services are configured.

## 8. Testing and debugging

| Command | Checks |
| --- | --- |
| `npm test` | Jest unit and component tests (`*.test.ts(x)` next to the code) |
| `npm run lint` | ESLint (app code only) |
| `npm run typecheck` | TypeScript |
| `npm run test:db` | Database migrations and pgTAP tests in PGlite |
| `npx supabase test db` | The same pgTAP tests on a local Supabase stack (Docker) |
| `node .claude/scripts/ship.mjs check` | Everything above plus build, dependency audit, docs check and secret scan, with PASS / FAIL / SKIP per check |
| `node scripts/docs-check.mjs --pr --base origin/main` | Whether your branch needs a docs update (see [section 10](#10-keeping-these-docs-current)) |

**Browser smoke test for the wireframe** (CI always runs it; locally it's optional):
```bash
npm i --no-save playwright@1.48.2
npx playwright install chromium
node .claude/scripts/ship.mjs check --e2e
```

**Debugging:** press `j` in the `npm start` terminal for the JavaScript debugger, or use the browser devtools with `npm run web`. To test one file, run `npx jest lib/pricing.test.ts`.

## 9. Git and pull requests

`main` only changes through reviewed pull requests.

1. **Branch:** `git switch main && git pull`, then `git switch -c feat/<short-name>` (or `fix/`, `chore/`, `docs/`).
2. **Check:** `node .claude/scripts/ship.mjs check` must pass.
3. **Commit:** stage files by path (`git add path/a path/b`) with a descriptive message. The pre-commit hook scans for secrets; never bypass it.
4. **Push:** `git push -u origin <branch>`, or `node .claude/scripts/ship.mjs push --title "..."` (re-runs the checks, refuses `main` and force pushes, and opens the PR if `gh` is signed in).
5. **Open the PR** and fill in the template, including the **Documentation** checklist.
6. **CI must be green:**
   - **Checks:** lint, types, tests, build, audit, database tests, wireframe smoke test, docs, secrets.
   - **Database:** runs when database files change.
   - **Documentation:** coverage and accuracy of these docs.
7. **Merge:** the other developer reviews; merge on GitHub. Apply any new migration afterwards (see [section 6](#6-database-supabase)).

### Claude Code (optional, shared through the repo)

Everything below is committed, so it works for both of you without extra setup:
- **`CLAUDE.md`:** project rules: Git workflow, docs upkeep, Obsidian notes.
- **`.claude/settings.json`:**
  - Permissions.
  - The Git guard hook (`.claude/hooks/git-guard.mjs`): blocks direct or force pushes, merges, committing on `main`, bulk staging, and Git writes by subagents.
  - Expo's official plugin, which adds Expo/EAS skills plus an Expo MCP server that asks you to sign in the first time.
- **`.mcp.json`:** Supabase's hosted MCP server, limited to the shared dev project and with write access, so Claude can query the database, read logs and advisors, run SQL and deploy edge functions. Schema changes still go through migrations and PRs ([section 6](#6-database-supabase)). ⚙️ One-time setup per machine:
  1. Set `SUPABASE_PROJECT_REF` in your shell, because Claude Code doesn't read `.env`. On macOS, add `export SUPABASE_PROJECT_REF=<ref>` to `~/.zshrc`. On Windows, run `setx SUPABASE_PROJECT_REF <ref>`. Then restart VS Code or your terminal.
  2. Start Claude Code in the repo and approve the `supabase` server when asked.
  3. Run `/mcp`, choose `supabase` and sign in to Supabase in the browser with your own account.
- **Project skills in `.claude/skills/`:**
  - `docs-review`: run `/docs-review` before opening a PR.
  - `react-native-testing`, `vercel-react-native-skills` and `vercel-composition-patterns`, pinned in `skills-lock.json`.
- **Scripts in `.claude/scripts/`:**
  - `ship.mjs`: the check-and-push script.
  - `audit.mjs`: the dependency audit, with reviewed exceptions in `.claude/audit-allowlist.json`.

Personal Claude Code setup (custom agents, global commands, Obsidian automation) lives in each developer's own `~/.claude/` and is not required.

## 10. Keeping these docs current

When a change affects setup or design (dependencies, env vars, migrations, auth, integrations, commands, tests, CI, Claude Code config), update this file and/or [ARCHITECTURE.md](ARCHITECTURE.md) **in the same PR**.

- `node scripts/docs-check.mjs` checks that the links, paths, `npm run` scripts and env vars named in these docs exist.
- On a PR, the **Documentation** workflow fails if setup-sensitive files changed but neither doc did, unless you tick *No documentation changes needed* in the PR description and say why.
- The Obsidian vault in `docs/MCE/` holds product notes, decisions and the development log. It is optional for onboarding; where it disagrees with the code or these files, the repo wins.

## 11. Troubleshooting

| Problem | Fix |
| --- | --- |
| `npm ci` fails with `EPERM … unlink …\*.node` (Windows) | A running dev server or editor has a native module open. Stop `npm start` / `npm run web` (and any `node` process on port 8081), then retry |
| Port 8081 already in use | Another Expo server is running. Stop it, or answer "yes" when Expo offers another port |
| npm prints `install-scripts … not yet covered by allowScripts` | Expected with npm 11; the skipped scripts (`@parcel/watcher`, `unrs-resolver`) aren't needed. Everything still passes |
| Commits aren't scanned for secrets | Run `git config core.hooksPath .githooks` (step 3 of setup) |
| Claude Code's `supabase` MCP server fails to connect or warns about a missing variable | `SUPABASE_PROJECT_REF` isn't set where Claude Code runs. Set it in your shell (see [Claude Code](#claude-code-optional-shared-through-the-repo)), restart VS Code, then sign in again with `/mcp` |
| `npm ci` fails with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` or "Exit handler never called" (macOS, Homebrew Node) | Homebrew's CA bundle is missing. Run `brew postinstall ca-certificates` and `brew postinstall openssl@3`, then retry |
| `supabase: command not found` | Use `npx supabase …`; the CLI is a dev dependency |
| `npx supabase start`, `npx supabase test db` or `npm run db:types` fail | They need Docker running. Use `npm run test:db` and the CI types artifact instead |
| Database workflow fails on "Committed types must match the schema" | Regenerate `types/database.ts` (`npm run db:types`, or download the `database-types` artifact) and commit it |
| Files show as modified with no real changes | Line-ending differences between Windows and macOS. Commit through Git (the repo's `.gitattributes` normalises them) rather than copying files between machines |
| Dependency audit fails on a new advisory | Upgrade the package with `npx expo install <pkg>`. Only if there is no fix and it can't reach the app, add a reviewed entry with an expiry date to `.claude/audit-allowlist.json` |
