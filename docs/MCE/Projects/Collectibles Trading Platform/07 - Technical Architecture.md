---
title: 07 - Technical Architecture
tags: [ctp, architecture]
updated: 2026-10-21
---

# Technical Architecture

Back to [[Index]]. Current repo layout: [[Architecture]].

> [!info] Status
> The repo already uses **Expo Router** and **Supabase** (files scaffolded, still empty). The rest of this note is ⚠️ a proposal.

## Technology stack (proposed)

| Layer | Choice | Why |
| --- | --- | --- |
| Mobile app | Expo (React Native) + Expo Router + TypeScript | Already in the repo; one codebase for iOS and Android |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions | Already in the repo; row-level security; little ops work |
| Payments | Stripe Connect (or similar marketplace payments) | Seller onboarding, identity checks, split payouts. We don't hold the money ourselves |
| Price data | ❓ To be chosen | See below |
| Shipping | ❓ A shipping-label API (e.g. Shippo or EasyPost) | Labels and tracking for sales and trades |
| Background jobs | Scheduled Edge Functions or `pg_cron` | Price refresh, value snapshots |

## Frontend

- Screens as in the wireframe: Home, Portfolio, Shop, Trades, Search, Wishlist, Product, Collector profile, New trade, Messages. See [[Architecture]].
- Shared components: `CardTile`, `ItemRow`, `ListingCard`, `PortfolioChart`.
- A fintech-style dashboard: clear numbers, charts, and gain/loss colours that are accessible in light and dark modes.
- Cache catalog and prices locally so the app stays fast.

## Backend services

| Service | Job |
| --- | --- |
| Catalog | Pokémon cards, sets and sealed products; images |
| Pricing | Fetch, store and serve market prices; daily value snapshots |
| Portfolio | Holdings, cost basis, realized/unrealized gains |
| Marketplace | Listings, orders, payouts, disputes |
| Trades | Offers, counters, state machine, shipping, completion |
| Messaging | Threads between users, tied to a trade or listing |
| Reputation | Ratings from completed orders and trades |

## Database requirements

Main tables (Postgres): `users`, `profiles`, `products` (catalog), `product_variants` (condition / grader + grade / sealed), `prices` (time series), `holdings`, `holding_lots` (cost basis per acquisition), `wishlist_items`, `listings`, `orders`, `trades`, `trade_items`, `messages`, `reviews`.

- Row-level security on every user-owned table.
- **Money stored as whole cents**, never floating-point numbers.
- Trades and orders as **state machines** (proposed → countered → accepted → shipped → received → completed / disputed / cancelled), changed only by server-side functions.
- An audit history of state changes for disputes.

## Market pricing integrations

🚧 **Decision in progress; it blocks Phase 1.** Full comparison in [[10 - Price Data Source]]. In short: TCGplayer's API is closed to new users; Scrydex (successor to the Pokémon TCG API) is the leading candidate for cards; sealed product may need a second source such as PriceCharting.

Requirements: licensed for commercial use, covers raw + graded + sealed, updated at least daily, affordable at MVP scale. Store the source and timestamp with every price so the app can show where a number came from.

## Security considerations

- Supabase Auth; consider phone or ID verification for sellers and high-value traders.
- **No card numbers or bank details in our database.** The payments provider handles them.
- Row-level security tested for every table; admin actions logged.
- Rate limits and fraud signals: new accounts, high-value first trades, unusual messaging.
- Image uploads checked (type, size) and stored with access rules.
- Secrets only in environment variables, never in the repo or the vault.

## Future scalability

- Catalog design that supports more categories (other trading card games, sports cards) without a rewrite: category-specific attributes in a flexible column or child tables.
- Move heavy pricing jobs to a separate worker if Edge Functions become a limit.
- Search: start with Postgres full-text search; move to a dedicated search service only if needed.
- A web version (Expo for web or a separate site) for sellers who list in bulk.
