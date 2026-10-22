---
title: Decisions
tags: [mce, decisions]
updated: 2026-10-21
---

# Decisions

Dated records of choices worth remembering. Newest first. Back to [[Home]].

## 2026-10-21 · Project docs live in this in-repo vault, mapped by role

- **Context:** documentation should be kept up to date automatically by Claude Code across all repos.
- **Decision:** keep this vault at `docs/MCE/` (versioned with the code). A global mapping (`~/.claude/obsidian/projects.json`) says which existing note plays each documentation role: [[Home]] is the index, [[Architecture]], [[Roadmap]], [[Development-Log]], and the startup plan's [[Projects/Collectibles Trading Platform/00 - Project Overview|Project Overview]] as product vision. Roles without a note (Database, Features, API Integrations, Changelog) get one only when there is content.
- **Alternatives:** one central vault for all projects (rejected: docs would not travel with the code); renaming notes to a fixed layout (rejected: breaks links for no gain).
- **Consequences:** after each meaningful task, the affected notes and the [[Development-Log]] are updated before the task counts as done. Only the main Claude session writes notes.

## 2026-10-21 · Git changes reach `main` only through reviewed pull requests

- **Context:** reduce manual Git work without risking `main`.
- **Decision:** Claude works on feature branches, runs checks with `.claude/scripts/ship.mjs check`, commits only task files, and publishes with `ship.mjs push` (re-runs checks, scans for secrets, pushes, opens or updates the PR). The user merges.
- **Enforced by:** a Claude Code hook (`.claude/hooks/git-guard.mjs`) that blocks raw pushes, force pushes, remote branch deletion, PR merges, `--no-verify`, commits on `main`, bulk staging and subagent Git writes; Git hooks in `.githooks/` (secret scan on every commit; refuse Claude's pushes to `main`, force pushes and deletions). Auto-push can be switched off with `git config claude.autopush false`.
- **Alternatives:** instructions only (rejected: not deterministic); GitHub branch protection (not configured yet; would add a server-side guarantee and needs the owner's go-ahead).

## 2026-10-21 · Dark, minimal design system for BINDER

- **Context:** the wireframe used glass surfaces, glowing gradients and neon accents, and inconsistent component styles.
- **Decision:** one token set in `wireframe/WF_reference.html`: background `#09090B`, surfaces `#111114`/`#17171B`, borders `#27272A`, text `#FAFAFA`/`#A1A1AA`, muted indigo accent `#7B80F0`, muted emerald/red for gains and losses; Geist with tabular figures; radii 6/8/12px; white primary buttons. The in-wireframe **Design system** page is the reference for building the Expo screens.
- **Consequences:** `constants/theme.ts` should mirror these tokens when the app is built. The prototype only shows features its sample data supports; anything else (shipping tracking, deposits, notifications) is marked "Planned".
