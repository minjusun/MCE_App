---
title: Collectibles Trading Platform — Index
tags: [moc, ctp]
updated: 2026-10-21
---

# Collectibles Trading Platform

An app for collectors that brings three things together: a **portfolio tracker**, **peer-to-peer trading** and a **marketplace**. It starts with Pokémon (raw cards, graded cards and sealed product). It should feel as polished as a fintech dashboard and as social as a collector community. Working title in the wireframe: **BINDER**. Codebase notes: [[Home]].

> [!info] How to read these notes
> - ✅ **Fact**: checked against a source, with the date it was checked
> - ⚠️ **Assumption**: believed but not validated; needs evidence before we rely on it
> - ❓ **Open question**: undecided

## Notes

1. [[00 - Project Overview]]: vision, mission, audience, value proposition
2. [[01 - Problem]]: what collectors struggle with today
3. [[02 - Solution]]: the three pillars and user journeys
4. [[03 - Competitive Analysis]]: Veriswap, TCGplayer, eBay, Collectr
5. [[04 - Business Model]]: revenue streams and costs
6. [[05 - MVP Roadmap]]: phases, dependencies and risks
7. [[06 - Go To Market]]: first users and community acquisition
8. [[07 - Technical Architecture]]: stack, services and integrations
9. [[08 - Risks and Assumptions]]: what could break the plan
10. [[09 - Pitch Deck]]: 10-slide summary
11. [[10 - Price Data Source]]: 🚧 choosing where prices come from

## Current status

- 🚧 **Concept and planning.** No users, revenue or validated demand yet.
- 📋 **Code:** the Expo/Supabase repo is scaffolded but every source file is empty. A clickable HTML wireframe exists (`wireframe/WF_reference.html`).

## Important decisions

| Decision | Status | Why |
| --- | --- | --- |
| Start with Pokémon only (raw, graded, sealed) | ✅ Decided | Narrow focus; one community to win first |
| Build the portfolio tracker first | ⚠️ Proposed | Useful to a single user with no network effects; brings in the users the marketplace and trading need later. See [[05 - MVP Roadmap]] |
| Mobile app on Expo (React Native) + Supabase | ✅ In repo | Matches the existing scaffold. See [[07 - Technical Architecture]] |
| Don't hold customer funds ourselves; use a payments provider | ⚠️ Proposed | Avoids money-transmitter licensing. See [[08 - Risks and Assumptions]] |

## Outstanding questions

- 🚧 Which price data source can we legally use, and what does it cost? (Blocks Phase 1.) TCGplayer's API is closed to new users; Scrydex is the leading candidate. See [[10 - Price Data Source]].
- ❓ Do collectors switch from Collectr for a better tracker alone, or only once trading exists?
- ❓ How do we verify trades: ship through our own hub (like Veriswap), use a grading partner, or rely on reputation and payment protection?
- ❓ Is sealed product in scope for trading on day one? Veriswap excludes it, which may be an opening or a warning.
- ❓ Who handles marketplace sales tax collection (marketplace-facilitator rules)?

## Next milestones

1. Interview 15–20 Pokémon collectors and traders to test the problems in [[01 - Problem]].
2. Choose and sign up to a price data source.
3. Ship Phase 1: portfolio tracker with search, holdings, cost basis and value history.
