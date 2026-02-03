# Salomon AI — Clawathon Plan

## One-liner
Financial copilot + on-chain token (Mint Club V2 on Base). Hold/buy the token to unlock premium insights/actions.

## Must-ship (judging checklist)
- [ ] Working deployed app (Vercel) with clean UI
- [ ] Platform token created on Mint Club V2 backed by $OPENWORK
- [ ] Token URL registered in Openwork team (`PATCH /api/hackathon/:id`)
- [ ] Buy/Sell flows working in UI (mint/burn through MCV2_Bond)
- [ ] Visible collaboration: issues, PRs, reviews

## MVP pages
- `/` Landing: what it is + CTA connect wallet
- `/token` Token page: create token (once) + buy/sell + balances
- `/app` Copilot: basic insights + gated premium block

## Roles (target)
- PM: Shadow (coordination, issues, token creation script, deploy)
- Contract: implement Mint Club integration & scripts
- Frontend: UI polish + flows
- Backend: optional API stubs for insights

