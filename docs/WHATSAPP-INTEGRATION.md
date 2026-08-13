# WhatsApp Cloud API integration

## Purpose and architecture

This is an inbound-only lead-handling MVP for Web Growth Digital Services. An email recipient can open a normal `wa.me` link, message Web Growth in WhatsApp, and the official Meta WhatsApp Cloud API delivers the webhook to the Next.js app.

`WhatsApp -> Meta Cloud API -> /api/whatsapp/webhook -> Supabase -> /admin/whatsapp`

The webhook validates Meta's signature, stores each event idempotently, classifies the message with deterministic rules, and only sends a safe free-form reply while the active customer-service window allows it. Commercial decisions are flagged for human review.

No WhatsApp Web session, QR automation, browser messaging, or unofficial WhatsApp library is used.

## Meta resources

Keep the following values in Vercel server-side environment variables, not in source control:

- Meta App ID: `1402137781802305`
- WhatsApp Business Account ID: obtain from Meta when the test/production number is provisioned.
- Phone Number ID: obtain from Meta when the test/production number is provisioned.

The production number must not be registered, migrated, or unregistered unless the owner explicitly approves the exact Meta onboarding flow.

## Required configuration

The callback endpoint is:

`https://webgrowth.info/api/whatsapp/webhook`

For isolated Preview testing, use the feature branch Preview URL plus `/api/whatsapp/webhook` until production deployment is approved.

| Variable | Purpose |
| --- | --- |
| `WHATSAPP_VERIFY_TOKEN` | Random shared value used only by Meta's GET webhook verification. |
| `META_APP_SECRET` | Validates `x-hub-signature-256` on inbound POST webhooks. |
| `WHATSAPP_ACCESS_TOKEN` | Server-side Meta system-user token for sending messages. |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API sender ID. |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Reference for the WhatsApp Business Account. |
| `WHATSAPP_GRAPH_API_VERSION` | Graph version, currently `v25.0`. |
| `SUPABASE_URL` | Project URL, server side only. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side database writer. Never prefix with `NEXT_PUBLIC_`. |

Use a temporary token only for the Meta test number. Before production, create the least-privileged system-user credential that Meta's current interface supports, place it in Vercel, and rotate it before its expiry.

## Database

Migration `202608130001_whatsapp_crm.sql` creates:

- `whatsapp_contacts` — minimal contact and lead fields.
- `whatsapp_conversations` — current intent, status and human-review state.
- `whatsapp_messages` — inbound/outbound messages, unique on Meta message ID.
- `whatsapp_events` — raw webhook event record for idempotency and audit.

The schema uses RLS, unique constraints, and indexes for contact lookup, conversations, events, and messages. Do not add a public policy for these tables. The service-role key is used only in the server-side webhook and dashboard server component.

## Classification and responses

The deterministic categories are `NEW_LEAD`, `PORTFOLIO_REQUEST`, `WEBSITE_AUDIT_REQUEST`, `SERVICE_QUESTION`, `PRICING_REQUEST`, `MEETING_REQUEST`, `PROJECT_SCOPE`, `DEADLINE_REQUEST`, `PROPOSAL_REQUEST`, `SUPPORT_REQUEST`, and `OTHER`.

Temperatures are `COLD`, `WARM`, and `HOT`. Pricing, proposals, meetings, scope, deadlines, and clear hire intent are HOT and require human review. The system never agrees to prices, discounts, dates, contracts, refunds, payment plans, budgets, or guarantees.

Only low-risk inbound questions receive an automatic reply. Free-form sends are blocked outside Meta's applicable customer-service window. Do not enable a template or broadcast without reviewing Meta's current rules and any message charge.

To temporarily disable automatic replies, remove `WHATSAPP_ACCESS_TOKEN` from the relevant Vercel environment and redeploy. Webhook ingestion will continue; sends will return `NOT_CONFIGURED`.

## Testing sequence

1. Deploy a Preview with the server-side verification token.
2. In Meta App Dashboard, configure the Preview callback URL and the same verify token. Subscribe to `messages`.
3. Claim or provision Meta's test phone number; do not use the production number.
4. Add a test recipient in Meta, then send an inbound test message.
5. Verify a single event, contact, conversation, and message appear in Supabase and `/admin/whatsapp`.
6. Confirm a low-risk query creates one safe response and repeated delivery of the same webhook does not duplicate it.
7. Confirm pricing/meeting/proposal messages become HOT and require human review without a commercial commitment.
8. Verify message status and error webhooks are stored.

## Production deployment and onboarding

Production deployment is a separate approval step after test-number success. Configure the production callback only after the feature branch has been reviewed, merged, and deployed to `webgrowth.info` with all required secrets.

Before connecting `+234 806 670 6336`, confirm Meta's current coexistence/onboarding path. Do not accept any flow that unregisters or migrates the existing WhatsApp Business app number unless the owner has been shown the effect on chat history, mobile app access, linked devices, downtime, contacts, and previous conversations and has explicitly approved it.

## Troubleshooting and safe shutdown

- **GET verification fails:** make sure the callback is publicly reachable and `WHATSAPP_VERIFY_TOKEN` exactly matches Meta. A deployment is required after changing Vercel environment variables.
- **POST returns 401:** configure `META_APP_SECRET`; Meta's signature must validate.
- **POST returns 503:** add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only to the target server environment.
- **No outbound reply:** confirm a configured access token, Phone Number ID, and active customer-service window.
- **Duplicate messages:** inspect `whatsapp_events` and the unique `whatsapp_message_id` before retrying manually.

To disconnect safely, first remove the Meta webhook subscription or callback, then remove the WhatsApp server-side credentials from Vercel and redeploy. This prevents new inbound processing and outbound messages without deleting CRM history. Revoke/rotate the Meta token in Meta Business Settings. Do not unregister the production number as part of a normal shutdown.
