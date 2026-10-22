---
title: 04 - Business Model
tags: [ctp, business]
updated: 2026-10-21
---

# Business Model

Back to [[Index]].

> [!warning] Status
> No pricing below has been tested with users. All rates are ⚠️ **starting assumptions**, set by comparison with competitors in [[03 - Competitive Analysis]]. No revenue forecasts are included because we have no data to base them on.

## Revenue streams

| Stream | How it works | Starting assumption | When |
| --- | --- | --- | --- |
| **Marketplace fee** | Percentage of each sale, charged to the seller | ⚠️ Below TCGplayer's ~10.75% + processing, to attract sellers. Exact rate to be decided | Phase 2 |
| **Trade fee** | Fee on completed trades, possibly only on the cash part or only for verified trades | ⚠️ Undecided. Veriswap reportedly charges 4% of trade value per user | Phase 3 |
| **Verification / escrow** | Optional paid service: we or a partner check items before they're released | ⚠️ Priced per item or as a percentage. Depends on partner costs | Phase 4 |
| **Premium analytics** | Subscription: deeper history, alerts, export, tax-ready gain/loss reports | ⚠️ Similar to Collectr Pro (reportedly ~$7.99/month) | Phase 1–4 |

## Other possible revenue (later, unvalidated)

- Promoted listings for sellers.
- Shipping labels, possibly with a margin, if a carrier partner allows it.
- Tools for local card shops (inventory sync, storefront).
- Affiliate fees when linking out to other marketplaces before our own marketplace has enough listings.

## Key operating costs

| Cost | Driver | Notes |
| --- | --- | --- |
| **Price data** | Licence or API fees | ❓ Unknown until a provider is chosen. Could be the largest fixed cost early on |
| **Payment processing** | Per transaction | Paid to the payments provider (e.g. Stripe); comes out of our fee or is passed on |
| **Hosting and database** | Users and data volume | Supabase and storage for images; small at MVP scale |
| **Fraud and disputes** | Chargebacks, refunds, support time | Grows with marketplace volume; hard to predict |
| **Verification** | Staff, space, insurance, shipping (own hub) or partner fees | Physical operations are expensive; see [[08 - Risks and Assumptions]] |
| **Customer support** | Disputes, shipping problems | Trades and sales generate support work |
| **Legal and compliance** | Terms, sales tax, payments rules | Needs a professional review before money moves |

## Weaknesses in this model

1. **Fee pressure.** Charging less than TCGplayer means lower margin per sale. That only works with volume, and volume needs liquidity we don't have yet.
2. **Trades earn little.** Card-for-card trades have no natural payment to take a cut from. Charging per trade may push traders back to free Discord trades.
3. **Subscriptions compete with a free incumbent.** Collectr's free tier sets the bar. Premium needs to offer clearly more.
4. **Verification is costly.** Running a hub means staff, insurance and logistics. Partnering costs money per item and gives less control.
5. **Revenue arrives late.** Phase 1 (tracker) earns little unless premium works. Marketplace and trade revenue only arrive after Phases 2 and 3.

## What to validate first

- Would collectors pay for premium analytics, and which features matter most? (Phase 1)
- What seller fee is low enough to move sellers but still covers costs? (Before Phase 2)
- Would traders pay a fee for protected trades rather than trade free on Discord? (Before Phase 3)
