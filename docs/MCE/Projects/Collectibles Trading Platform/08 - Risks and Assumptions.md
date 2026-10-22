---
title: 08 - Risks and Assumptions
tags: [ctp, risks]
updated: 2026-10-21
---

# Risks and Assumptions

Back to [[Index]].

## Key assumptions (all ⚠️ unvalidated)

| # | Assumption | How to test |
| --- | --- | --- |
| A1 | Collectors are frustrated enough with using several apps to switch | Interviews; Phase 1 sign-up and retention |
| A2 | A tracker can win users from Collectr's free tier | Beta retention; what testers say they'd lose if we disappeared |
| A3 | Collectors want tracking, buying and trading in the same app | Interviews; % of Phase 1 users who try listing |
| A4 | Traders will pay a fee for protected trades | Price test before Phase 3 |
| A5 | Sellers will move inventory for lower fees | Seller recruitment before Phase 2 |
| A6 | We can get price data on affordable, legal terms | Provider evaluation (blocks Phase 1) |

## Risks

### Marketplace liquidity and network effects
- Buyers come for listings; sellers come for buyers. With neither, the marketplace is empty.
- Trading is harder still: you need someone who has what you want *and* wants what you have.
- **Response:** tracker first; recruit sellers before launch; start with a narrow category; link out to other marketplaces until ours has enough listings.

### Trust and fraud prevention
- Fakes, resealed sealed product, condition disputes, "item not received" scams, chargebacks.
- One bad early incident can damage the brand in a small community.
- **Response:** payments provider with identity checks; value limits for new accounts; reputation; clear dispute rules; verification later. ⚠️ Sealed product is especially hard to verify.

### Price data reliability
- Raw cards vary by condition; thinly traded cards have noisy prices; sealed prices can be manipulated.
- If our prices look wrong, users won't trust the app.
- **Response:** show source and date for every price; show ranges where data is thin; let users override values.

### User acquisition
- Established competitors have users, money and brand recognition.
- Discord communities may resist a commercial tool.
- **Response:** become a trusted community member first; shareable binders; test each channel and measure it.

### Revenue assumptions requiring validation
- Marketplace fee below TCGplayer's still has to cover processing, support and fraud.
- Trade fees may push traders back to free Discord trades.
- Premium subscription has to beat a free incumbent.
- Revenue only arrives in Phase 2 or later, so the runway must cover Phase 1 with little income.

### Regulatory and legal
- **Holding customers' money** (escrow) may require money-transmitter licences. Use a payments provider's marketplace product instead. ⚠️ Confirm with a lawyer.
- **Sales tax:** marketplace-facilitator laws may require collecting tax for sellers.
- **Seller tax reporting:** payment providers may report seller earnings to tax authorities.
- **Trademarks:** "Pokémon" and card images are owned by others. Check how we use names and images.
- **App store rules** for in-app purchases vs physical goods.

### Competitive response
- eBay/TCGplayer, Collectr or Veriswap could add the missing pieces faster than we can build all three. See [[03 - Competitive Analysis]].

### Execution
- Three products in one is a lot for a small team. **Response:** follow the phase order in [[05 - MVP Roadmap]]; don't start Phase 3 before Phase 2 works.
