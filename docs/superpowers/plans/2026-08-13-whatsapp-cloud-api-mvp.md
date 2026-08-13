# WhatsApp Cloud API MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure, deterministic inbound WhatsApp Cloud API lead workflow with a minimal Supabase CRM and protected Web Growth lead dashboard.

**Architecture:** A Node.js Next.js route validates Meta verification and HMAC signatures, writes unique events before bounded processing, persists normalized contacts/conversations/messages through server-only Supabase REST calls, classifies intent without AI, and sends only safe free-form replies inside the service window. An internal, noindex dashboard reads the same data through the existing signed-cookie pattern.

**Tech Stack:** Next.js 15 App Router, TypeScript, Node.js crypto, Supabase PostgREST, Meta Graph API, node:test via tsx.

## Global Constraints

- Official Meta Cloud API only; no WhatsApp Web automation, third-party sender, marketing broadcast, or paid AI.
- Keep all credentials server-side and out of Git.
- Do not modify the existing number until test-number success and a separate explicit owner approval.
- Store minimum necessary data and make all webhook/message writes idempotent.
- Dashboard must use internal authentication and `noindex` metadata.

---

### Task 1: Establish test foundation and deterministic lead rules

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/lib/whatsapp/types.ts`, `src/lib/whatsapp/classify.ts`, `src/lib/whatsapp/classify.test.ts`

**Interfaces:** Produces `classifyWhatsAppIntent(text: string): WhatsAppClassification` and `isFreeformReplyAllowed(messageTimestamp: number, now?: number): boolean`. Classification contains `intent`, `temperature`, `humanReviewRequired`, and `safeReplyKind`.

- [ ] Write failing tests for proposal/pricing/meeting/project/deadline being HOT with review, portfolio/audit/service/new-lead safe responses, OTHER, and the 24-hour boundary.

```ts
test("classifies proposal as hot human review", () => {
  assert.deepEqual(classifyWhatsAppIntent("Please send a proposal"), {
    intent: "PROPOSAL_REQUEST", temperature: "HOT", humanReviewRequired: true, safeReplyKind: "ACKNOWLEDGEMENT",
  });
});
```

- [ ] Run `npx tsx --test src/lib/whatsapp/classify.test.ts`; verify it fails because the module is absent.
- [ ] Implement all requested intent categories and fixed phrase-based rules, including non-committal acknowledgement for HOT leads and a pure 24-hour service-window predicate.
- [ ] Run the test again; verify all tests pass.
- [ ] Commit with `git add package.json package-lock.json src/lib/whatsapp && git commit -m "feat: add WhatsApp lead classification rules"`.

### Task 2: Create minimal Supabase CRM schema and idempotent store

**Files:**
- Create: `supabase/migrations/202608130001_whatsapp_crm.sql`, `src/lib/whatsapp/store.ts`, `src/lib/whatsapp/store.test.ts`

**Interfaces:** Produces `recordWebhookEvent`, `getOrCreateWhatsAppContact`, `getOrCreateConversation`, `recordWhatsAppMessage`, `updateMessageStatus`, and `markHumanReviewRequired`.

- [ ] Write failing test for a duplicate Meta message ID producing one event, contact, conversation, message, and no duplicate outbound eligibility.

```ts
test("does not duplicate a retried Meta message", async () => {
  await store.recordInbound(exampleMessage);
  await store.recordInbound(exampleMessage);
  assert.equal(store.messages.length, 1);
});
```

- [ ] Run `npx tsx --test src/lib/whatsapp/store.test.ts`; verify it fails because the store is absent.
- [ ] Implement migration tables `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages`, `whatsapp_events`, unique Meta identifiers, foreign keys, RLS, service-only access, and appropriate indexes. Implement a server-only REST client that uses conflict-safe upserts.
- [ ] Run store tests; verify duplicate event/message and status-update tests pass.
- [ ] Commit with `git add supabase/migrations src/lib/whatsapp/store* && git commit -m "feat: persist WhatsApp CRM events idempotently"`.

### Task 3: Implement signed Meta webhook intake

**Files:**
- Create: `src/app/api/whatsapp/webhook/route.ts`, `src/lib/whatsapp/webhook.ts`, `src/lib/whatsapp/webhook.test.ts`

**Interfaces:** Consumes verify token, app secret, classifier, store, sender. Produces GET challenge verification and POST text/status/error processing.

- [ ] Write failing tests for GET challenge success/failure, invalid `x-hub-signature-256`, malformed payload, valid inbound text, duplicate retry, status, and error event.

```ts
test("returns challenge only for configured token", async () => {
  const response = await verifyWebhook(new URL("https://x/?hub.mode=subscribe&hub.verify_token=ok&hub.challenge=abc"), "ok");
  assert.equal(await response.text(), "abc");
});
```

- [ ] Run `npx tsx --test src/lib/whatsapp/webhook.test.ts`; verify it fails because handlers are absent.
- [ ] Implement constant-time `sha256=` HMAC comparison, payload validation, early idempotent event record, normalized processing, sanitized server logs, and prompt HTTP 200 after acceptance.
- [ ] Run tests; verify all webhook cases pass.
- [ ] Commit with `git add src/app/api/whatsapp src/lib/whatsapp/webhook* && git commit -m "feat: add secure WhatsApp webhook intake"`.

### Task 4: Implement official outbound sender and response guardrails

**Files:**
- Create: `src/lib/whatsapp/send.ts`, `src/lib/whatsapp/send.test.ts`

**Interfaces:** Produces `sendWhatsAppText({ to, text, replyToMessageId, customerMessageTimestamp }): Promise<SendResult>`.

- [ ] Write failing tests for successful Graph `/messages` payload, reply context, missing configuration, service-window refusal, unsafe intent refusal, API errors, and outbound persistence.

```ts
test("refuses arbitrary free-form reply outside service window", async () => {
  assert.deepEqual(await sendWhatsAppText({ ...input, customerMessageTimestamp: Date.now() / 1000 - 86401 }), { sent: false, reason: "SERVICE_WINDOW_CLOSED" });
});
```

- [ ] Run `npx tsx --test src/lib/whatsapp/send.test.ts`; verify it fails because sender is absent.
- [ ] Implement server-side Graph API fetch using the current configured API version, messages endpoint, text body, optional reply context, sanitized error output, and persistence only after a successful Meta response.
- [ ] Run tests; verify all sender rules pass.
- [ ] Commit with `git add src/lib/whatsapp/send* && git commit -m "feat: add guarded WhatsApp Cloud API sender"`.

### Task 5: Build protected lead dashboard

**Files:**
- Create: `src/app/admin/whatsapp/page.tsx`, `src/app/admin/whatsapp/WhatsAppLeadDashboard.tsx`, `src/app/admin/whatsapp/page.test.ts`
- Modify: `src/lib/route-governance.json`

**Interfaces:** Consumes the existing `readInternalUtilityCookie` plus CRM query functions. Produces `/admin/whatsapp` with HOT, WARM, Needs Review, Pricing, Meeting, and Proposal filters and selected conversation history.

- [ ] Write failing tests for unauthenticated denial and correct HOT filter output.

```ts
test("filters exactly the hot lead", () => assert.deepEqual(filterLeads(fixtures, "HOT").map((lead) => lead.id), ["hot-1"]));
```

- [ ] Run `npx tsx --test src/app/admin/whatsapp/page.test.ts`; verify it fails because dashboard helpers are absent.
- [ ] Implement server-authenticated, noindex dashboard showing name, wa_id, website, source, intent, temperature, last message/time, review flag, status, and conversation messages. Do not expose service credentials or create a public route.
- [ ] Run tests; verify access and all requested filter tests pass.
- [ ] Commit with `git add src/app/admin/whatsapp src/lib/route-governance.json && git commit -m "feat: add protected WhatsApp lead dashboard"`.

### Task 6: Complete environment contract and operations documentation

**Files:**
- Modify: `.env.local.example`
- Create: `src/lib/whatsapp/config.ts`, `src/lib/whatsapp/config.test.ts`, `docs/WHATSAPP-INTEGRATION.md`

**Interfaces:** Produces `validateWhatsAppConfiguration(env): { configured: boolean; missing: string[] }` with variable names only.

- [ ] Write failing test that missing config reports names without values.

```ts
test("does not expose secret values", () => assert.deepEqual(validateWhatsAppConfiguration({}), { configured: false, missing: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN", "META_APP_SECRET"] }));
```

- [ ] Run `npx tsx --test src/lib/whatsapp/config.test.ts`; verify it fails because validator is absent.
- [ ] Add placeholders only for WhatsApp, Meta, Supabase, and internal-dashboard variables. Document architecture, tables, classifications, auto-reply/human-review policy, test flow, deployment, error handling, credential rotation, disabling auto-replies, safe disconnect, and prefilled campaign-link references.
- [ ] Run `npx tsx --test src/lib/whatsapp/*.test.ts && npm run lint && npm run build`; verify all pass and no secret appears in output.
- [ ] Commit with `git add .env.local.example docs/WHATSAPP-INTEGRATION.md src/lib/whatsapp/config* && git commit -m "docs: add WhatsApp deployment guide"`.

### Task 7: Configure and validate the Meta test number

**Files:** Deployment/Meta configuration only; no production-number modification.

- [ ] Deploy the feature branch and add actual server-side variables only through the hosting dashboard.
- [ ] Configure `https://webgrowth.info/api/whatsapp/webhook` and subscribe to `messages` using a test number.
- [ ] Test verification, inbound text, contact/conversation/message persistence, classification, safe reply, HOT escalation, outbound message, delivery status, duplicate retry, and API error.
- [ ] Record only test outcomes in the operator guide, then commit documentation if changed.

### Task 8: Decide production-number coexistence only after live test success

**Files:** Deployment/Meta settings only after explicit owner approval.

- [ ] Inspect Meta’s live onboarding screen for coexistence/embedded signup and capture its statements about history, Business app, linked devices, contacts, and downtime.
- [ ] Stop and request explicit approval before phone verification, migration, re-registration, business verification, permissions, payment, or production activation.
- [ ] After approval, run the owner’s separate-number production test and verify no duplicated reply or credential exposure.

## Plan self-review

- Coverage: Tasks 1–4 cover classification, security, idempotency, storage, and official sending; Task 5 covers the dashboard; Task 6 covers operations; Tasks 7–8 retain all live Meta and production safety gates.
- No placeholders: blank environment values are deliberate placeholders; no implementation step defers an undefined behavior.
- Interfaces: classifier feeds webhook and sender; store provides the shared CRM data for webhook and dashboard.
