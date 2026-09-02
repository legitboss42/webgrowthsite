# WhatsApp Stage 6 — Web Growth production workflow setup

Last updated: 2026-09-02

Status: **OPEN — configuration and production journeys still require completion/testing. Do not mark Stage 6 complete yet.**

## Codex setup checkpoint

Codex created these 12 workflows in production Supabase, all left DRAFT:

1. `WG — MASTER INTAKE ROUTER`
2. `WG — BUSINESS WEBSITE`
3. `WG — WEBSITE REDESIGN`
4. `WG — LANDING PAGE`
5. `WG — ECOMMERCE`
6. `WG — SEO & GROWTH`
7. `WG — MAINTENANCE & SUPPORT`
8. `WG — AUTOMATION & CRM`
9. `WG — PRICING & PACKAGES`
10. `WG — EXISTING CLIENT`
11. `WG — GENERAL ENQUIRY`
12. `WG — NO REPLY FOLLOW-UP`

The Master uses `CONVERSATION_OPENED` (`Update lifecycle · Open chat`), not generic `NEW_MESSAGE`. Service workflows use `TAG_ADDED`; no-reply follow-up uses `NO_CUSTOMER_REPLY`.

## Defects found during setup

The initial production setup attempt exposed two builder/model defects:

1. Adding an action inside a nested Branch updated the action tree but did not reliably move the Properties inspector to the new child action. Deep child selection therefore became unreliable for browser automation.
2. Workflow normalization rejected branch nesting deeper than 5 levels. A 10-choice list routed through binary Yes/No branches can require up to 9 nested branches, so the Master router could not be represented safely at the previous limit.

Fixes on `main`:

- `c26355fd5903916d0dbd4512239fad079b9ec5e8` — nested branch additions now immediately select the exact child, empty Yes/No paths create/select their child directly, and the selected action path is exposed in the Properties panel and DOM.
- `b252cd162df855a8949226f2fcd81c8dfcc56d02` — supported branch depth raised to 12 and `trigger.payload.answerId` added to condition suggestions for stable question-option routing.
- `802460d00ab23225ccb1864969e42efc9fe3f058` — automated regression test for a 10-choice Master router using stable option IDs.

## Master router recovery

Production Supabase `WG — MASTER INTAKE ROUTER` is now DRAFT v2 and routes all ten saved list choices using stable `trigger.payload.answerId` values:

- `website` → `WG_ROUTE_WEBSITE`
- `redesign` → `WG_ROUTE_REDESIGN`
- `landing` → `WG_ROUTE_LANDING`
- `ecommerce` → `WG_ROUTE_ECOMMERCE`
- `seo` → `WG_ROUTE_SEO`
- `maintenance` → `WG_ROUTE_MAINTENANCE`
- `automation` → `WG_ROUTE_AUTOMATION`
- `pricing` → `WG_ROUTE_PRICING`
- `support` → `WG_ROUTE_SUPPORT`
- `other` → `WG_ROUTE_OTHER`

The Master remains DRAFT intentionally. No production workflow should be activated until the service workflows are completed and the requested journey/lifecycle tests pass.

## Still incomplete

The service workflows are still mostly initial-message shells. Stage 6 remains OPEN until the remaining intended configuration is saved and production-tested, including the agreed service qualification questions, CRM-stage changes, internal notes, budget/quote routing, portfolio/human handoff paths, and the requested journey/lifecycle verification.

Do not treat the existing 12 DRAFT rows as proof of Stage 6 completion.
