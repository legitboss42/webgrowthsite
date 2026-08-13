# Web Growth WhatsApp Cloud API MVP

## Goal

Create a low-cost, official Meta WhatsApp Cloud API inbound lead system for Web Growth Digital Services. It accepts prospect-initiated WhatsApp messages, stores the minimum necessary CRM data, classifies sales intent deterministically, sends only safe responses, and escalates commercial decisions for founder review.

## Existing Meta state

- Meta Business Portfolio: Web Growth
- Meta developer apps: none currently listed for that portfolio
- WhatsApp Business Account: existing Web Growth account
- Production number: +234 806 670 6336, already registered and shown as Offline
- Phone Number ID: recorded in deployment configuration only; never committed to source control

The existing number will not be migrated, unregistered, or connected to Cloud API until Meta's supported coexistence/onboarding route and its effect on the WhatsApp Business app, chat history, linked devices, contacts, and downtime are confirmed in the live Meta UI and explicitly approved.

## Architecture

```text
Email CTA / wa.me link
  -> Prospect initiates WhatsApp chat
  -> Meta WhatsApp Cloud API webhook
  -> /api/whatsapp/webhook
  -> signature + payload validation + idempotent event write
  -> minimal Supabase CRM records
  -> deterministic classifier
  -> safe response sender only within Meta's permitted service window
  -> /admin/whatsapp protected lead dashboard
```

The webhook replies with HTTP 200 promptly after validation and persistence. Any later automation is isolated from the verification path; MVP processing remains bounded and deterministic.

## Server components

- `src/app/api/whatsapp/webhook/route.ts`: Meta GET verification and signed POST event intake.
- `src/lib/whatsapp/*`: payload validation, classification, Supabase REST access, idempotency, and Meta Messages API sending.
- `supabase/migrations/*`: minimal contacts, conversations, messages, events, indexes, and uniqueness constraints.
- `src/app/admin/whatsapp/page.tsx`: protected, noindex lead queue and conversation history.
- `src/app/admin/whatsapp/actions.ts`: authenticated review-only mutations where needed.
- `docs/WHATSAPP-INTEGRATION.md`: operator documentation and safe disable/credential-rotation procedures.

The dashboard uses the existing signed internal-utility cookie pattern, with a production-only configured passphrase and session secret. It is not exposed to public visitors or search engines.

## Data and privacy

Four tables will be created: `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages`, and `whatsapp_events`.

- Message and event identifiers are unique where Meta supplies them, preventing duplicate contacts, records, or replies.
- Raw webhook payloads are stored only as needed for traceability and replay protection.
- Secrets remain server-side in deployment environment variables; Supabase service-role credentials never reach browser code.
- Logs use identifiers and outcomes without access tokens, app secrets, or avoidable message content.

## Classification and reply policy

Intent categories are NEW_LEAD, PORTFOLIO_REQUEST, WEBSITE_AUDIT_REQUEST, SERVICE_QUESTION, PRICING_REQUEST, MEETING_REQUEST, PROJECT_SCOPE, DEADLINE_REQUEST, PROPOSAL_REQUEST, SUPPORT_REQUEST, and OTHER.

Pricing, proposals, meetings, explicit project requests, scope, deadline/start-date discussions, payment, refunds, discounts, guarantees, contracts, and third-party spend make the lead HOT where applicable and set `human_review_required` to true. The system sends only a non-committal acknowledgement.

Automatic replies are limited to portfolio links, requesting a website URL for an audit, concise service descriptions, and a short new-lead question. The sender checks the applicable Meta customer-service window and never sends an arbitrary free-form reply when a template is required.

## Credentials and deployment

Required server-only variables are `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` plus the internal dashboard session settings. `.env.example` will contain placeholders only.

Production credentials will use Meta's current supported system-user/long-lived mechanism after the test-number flow passes. Temporary Meta tokens are test-only.

## Testing

Automated tests cover verification, invalid signatures, idempotency, contact/conversation creation, each classification tier, customer-window response gating, outbound persistence, and webhook statuses/errors. A test Meta number is used before the production number. The production number is not touched without a separate explicit approval after the test flow succeeds.

## Non-goals

- No cold outreach, broadcasts, marketing templates, unofficial WhatsApp libraries, browser/QR automation, or session scraping.
- No paid SaaS middleware, paid CRM, Twilio, WATI, Zapier, Make, Pabbly, or paid AI API.
- No changes to the existing production outreach tracker until WhatsApp processing is working and a safe linkage is required.
