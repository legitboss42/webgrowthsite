# WhatsApp Stage 8 — Flows

Stage 8 adds official Meta WhatsApp Flows to the Web Growth WhatsApp workspace and connects them to Conversations, CRM, and the Stage 6 automation engine.

## Workspace

- Flow Manager: `/admin/whatsapp/flows/`
- Conversation send endpoint: `/api/admin/whatsapp/flows/send/`
- Flow management endpoint: `/api/admin/whatsapp/flows/`
- Dynamic Flow Data API endpoint: `/api/whatsapp/flows/data/`

Owner and Manager roles can manage Flow definitions. Agents can send Published Flows only when they are authorised to work the selected conversation.

## Lifecycle

1. Create a Draft Flow from scratch or a starter.
2. Edit screens/components and CRM mappings locally.
3. Flow JSON is uploaded to Meta for validation.
4. Publish after Meta validation succeeds.
5. Published Meta Flows are immutable. Duplicate a Published Flow to create a new editable version.
6. Deprecate Published Flows that should no longer be used.

## Stage 6 integration

Automation triggers:

- `WHATSAPP_FLOW_STARTED`
- `WHATSAPP_FLOW_COMPLETED`

Automation action:

- `SEND_WHATSAPP_FLOW`

The visual Automation Builder loads Published Flows from the same authenticated Flow-send API used by Conversations. Flow triggers can target one Published Flow or all Published Flows.

Flow completion answers are available to conditions through paths such as:

- `trigger.payload.flow.fields.service`
- `trigger.payload.flow.fields.budget`
- `trigger.payload.flow.fields.date`
- `trigger.payload.flow.fields.<custom_field>`

Flow sends and completions are tracked in submission/event storage and CRM mappings are applied server-side.

## Conversation integration

When a conversation is selected, the workspace exposes a **Send Flow** control. It:

- lists only Published Flows;
- enforces conversation access;
- sends the official Meta interactive Flow message;
- records the outbound message in conversation history;
- creates a tracked Flow submission;
- emits the Flow Started automation event.

## Dynamic Data API encryption

Dynamic Flows use Meta's encrypted Data API channel. The private RSA key must remain server-side and must never be committed to Git or stored in a client-readable database row.

Required production environment variable:

```text
WHATSAPP_FLOW_PRIVATE_KEY=<PEM RSA private key>
```

Optional when the PEM is passphrase-protected:

```text
WHATSAPP_FLOW_PRIVATE_KEY_PASSPHRASE=<passphrase>
```

The public key is registered with Meta through the authenticated Flow key endpoint. Dynamic Flow publication is intentionally blocked when the private key is not configured. Static Flows do not require this private key.

## Storage

Stage 8 uses:

- `whatsapp_flows`
- `whatsapp_flow_versions`
- `whatsapp_flow_submissions`
- `whatsapp_flow_events`
- `whatsapp_flow_runtime_config`

RLS is enabled on all Stage 8 tables. The application accesses them from trusted server routes with the Supabase service role; there are intentionally no public RLS policies for these server-only tables.

## Production migrations

- `20260902132906_whatsapp_flows_stage8`
- `20260902135229_whatsapp_stage6_stage8_fk_indexes`

The latter adds covering indexes for Stage 6/8 foreign-key paths used by automation and Flow audit queries.

## Production verification checklist

- [x] Stage 8 schema applied to Supabase.
- [x] RLS enabled on Stage 8 storage.
- [x] Stage 6/8 foreign-key indexes applied.
- [x] Flow Manager route governed as private/noindex application UI.
- [x] Conversation Flow-send API implemented.
- [x] Conversation Flow-send UI implemented.
- [x] Stage 6 Flow triggers and send action implemented.
- [x] Stage 6 visual Flow selectors implemented.
- [x] Static `nfm_reply` completion processing implemented.
- [x] Dynamic Data API endpoint and encryption implementation added.
- [ ] Configure `WHATSAPP_FLOW_PRIVATE_KEY` in production before publishing Dynamic Flows.
- [ ] Run real Meta end-to-end sends with a test recipient during the dedicated production test pass.
