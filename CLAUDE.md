# MCE_App

## Developer documentation (source of truth)

`ONBOARDING.md` (setup, commands, environment, workflow, troubleshooting) and `ARCHITECTURE.md` (design, schema, auth, integrations, infrastructure) describe the actual implementation. Both developers rely on them, so they must stay true.

- **When a change touches any of these, decide whether either file needs updating, and update it in the same task and PR:**
  - technology stack, frameworks, libraries or dependencies
  - environment variables (`.env.example`)
  - database schema or migrations
  - authentication
  - API integrations
  - development commands or scripts
  - testing procedures
  - CI or deployment configuration
  - Claude Code agents, skills, hooks or settings
- **Skip trivial changes** (UI tweaks, refactors without new concepts, tests for existing behaviour); don't rewrite docs for them.
- **Describe what the code does now.** Keep the status markers (✅ implemented / 🚧 in progress / 📋 planned / ⚙️ manual setup) accurate. Never document unbuilt services as if they exist.
- **Verify every command, path and env var you document;** run commands where possible. Write cross-platform instructions (macOS and Windows), with no absolute or machine-specific paths. Name env vars only, never values.
- **Before opening or updating a PR,** run the `docs-review` skill (`/docs-review`). It runs `node scripts/docs-check.mjs --pr --base origin/main`. Report any doc you could not update or verify as a known gap in the PR, instead of calling the PR ready.

## Obsidian notes

Project knowledge also lives in the Obsidian vault at `docs/MCE/` (start at `Home.md`). It holds product notes, decisions and the development log, and is optional for onboarding. Where it disagrees with the code, `ONBOARDING.md` or `ARCHITECTURE.md`, the repo wins; fix the note. The notes are Obsidian Markdown: use wiki links like `[[Roadmap]]`, and keep the status markers ✅ implemented / 🚧 in progress / 📋 planned / 💡 idea accurate.

When a change alters behaviour described there, update the matching note in the same change (`Architecture.md` for file structure and screens, `Roadmap.md` for status) and add a dated entry to `Development-Log.md`. Never write credentials, environment variable values or user data into the docs. Don't edit `docs/MCE/.obsidian/`.

## Git workflow

The main session owns Git. Subagents edit files and report what they changed; they never stage, commit, push or touch PRs (a hook blocks it).

1. **Start:** for each development task, create a feature branch from an up-to-date `main`: `git switch -c <type>/<short-name>` (`feat/`, `fix/`, `chore/`, `docs/`). If uncommitted changes unrelated to the task already exist, leave them alone; they travel with the switch but must never be staged.
2. **Check:** when a meaningful piece of work is done, run `node .claude/scripts/ship.mjs check` (lint, type check, tests, build, whatever the repo has). If anything fails, report it and stop; keep the changes local.
3. **Commit:** stage only the files you changed for this task, by path (`git add path/a path/b`, never `-A`, `.` or `commit -a`). Review `git diff --cached` before committing. Write a descriptive message: a short imperative summary line, then why and what changed.
4. **Publish:** first run `/docs-review` and update `ONBOARDING.md` / `ARCHITECTURE.md` in the same branch as needed. Write the PR body from `.github/pull_request_template.md`, and tick the matching **Documentation** box: docs updated, or "No documentation changes needed" with the reason. Then run `node .claude/scripts/ship.mjs push --title "<PR title>" --body-file <file>`. It re-runs the checks, scans the new commits for secrets, pushes the branch and opens or updates the pull request. Never run `git push` directly.
5. **Stop at the PR.** Never merge into `main`, deploy, force-push, delete remote branches or rewrite pushed history. Those need the user's explicit approval, and the user does them.

Never commit `.env` files, keys, tokens or credentials. A pre-commit secret scan (`.githooks/`) enforces this; don't bypass it with `--no-verify`. If the user has turned pushes off (`git config claude.autopush false`), commit locally and tell them the branch is ready.
