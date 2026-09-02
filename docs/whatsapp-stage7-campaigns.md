# WhatsApp Stage 7 — Campaigns

Status: implemented for production deployment. Stage 6 remains pending its final Owner workflow-configuration verification; Stage 7 does not retroactively close Stage 6.

## Scope

- Supervisor-only Campaigns workspace for Owner/Manager.
- Reusable CRM audiences with AND/OR conditions across tags, CRM stage, lead temperature, source, consent, conversation lifecycle, assignment, last interaction, standard fields, and `custom.*` fields.
- Audience preview with matched, eligible, opted-out, unknown-consent, and invalid-number counts.
- Explicit WhatsApp campaign eligibility: only `OPTED_IN` contacts with valid WhatsApp numbers are sendable.
- Approved Meta templates only. Template approval is checked when configuring and again immediately before sending.
- Header/body template variable mapping from contact fields, custom fields, or static values.
- Owner test-send support before launch.
- Draft, scheduled, running, paused, completed, cancelled, and failed campaign states.
- Recipient snapshot when a campaign is scheduled/launched. Consent, template approval, number validity, and frequency limits are rechecked live before each send.
- Durable Supabase recipient queue with `FOR UPDATE SKIP LOCKED` claiming and a one-minute `pg_cron`/`pg_net` processor.
- Conservative interrupted-worker handling: an unverifiable `SENDING` row is failed rather than retried, preventing accidental duplicate campaign sends.
- Marketing frequency controls from runtime config: default maximum 1 marketing campaign per 24 hours and 3 per 7 days per contact.
- Meta delivery webhook attribution for sent/delivered/read/failed states.
- Inbound campaign reply attribution and opt-out keywords (`STOP`, `UNSUBSCRIBE`, `CANCEL`, `OPT OUT`, `REMOVE ME`). Opt-out updates the CRM immediately and future sends are suppressed.
- Campaign recipient drill-down and aggregate delivery/read/reply reporting.
- Campaign outbound messages are written into the WhatsApp conversation history. A campaign alone does not deliberately start the Stage 6 conversation lifecycle; a customer reply opens the chat normally and can trigger the configured `Update lifecycle · Open chat` automation.

## Database

Production migration version: `20260902120037` (`whatsapp_campaigns_stage7`).

Repository source: `supabase/migrations/20260902120037_whatsapp_campaigns_stage7.sql`.

Tables:

- `whatsapp_segments`
- `whatsapp_campaigns`
- `whatsapp_campaign_recipients`
- `whatsapp_campaign_events`
- `whatsapp_campaign_runtime_config`

Queue functions:

- `claim_whatsapp_campaign_recipients(integer)`
- `refresh_whatsapp_campaign_counts(uuid)`

Cron:

- `webgrowth-whatsapp-campaign-processor` every minute

The campaign processor reuses the Stage 6 automation processor secret already held server-side in Supabase. No new Vercel environment variable is required.

## Safety model

- No campaign UI for Agents in this release.
- No override for unknown or opted-out consent.
- No non-approved template launch.
- No retry after an interrupted send with unknown Meta outcome.
- Campaign cancellation prevents pending recipients from being sent.
- Service-role Supabase access remains server-only; campaign tables have RLS enabled with no public policies.
