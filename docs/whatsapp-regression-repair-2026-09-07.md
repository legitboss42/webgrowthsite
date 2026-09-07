# WhatsApp regression repair — 2026-09-07

## Current status

Two regressions introduced/exposed by the Stage 12 redesign are now corrected on the Vercel-blocked `stage12-visual-redesign-v2` branch:

1. interactive outbound sends could return HTTP 500 after Meta accepted the message because the local Supabase history write lost the authenticated `workspace_id`;
2. Automation and Flow builders used the Inbox-only full-viewport shell mode, clipping lower Properties controls.

No second production deployment has been made. The corrected branch is being held for explicit release approval.

## Reported symptoms

- Inbox replies appeared unable to send.
- Workflow/Automation Properties settings could not be reached reliably after the Stage 12 redesign.
- WhatsApp Flow builder settings showed the same clipping pattern.

## Production evidence

### Live reply failure after the first repair

Production deployment `dpl_5ESYAEAuvrgR9Lt7PwU7VegGuwiN` for merge commit `a4a0dd0ceca953e238059451979e6480c1aa98b1` reached READY.

A real Owner send attempt at `2026-09-07T12:38:17Z` then produced:

- `POST /api/admin/whatsapp/reply/` → HTTP 500
- `Supabase WhatsApp store request failed: 400`
- failure stack inside `recordOutbound()`

This proved the first tenant-propagation repair was incomplete in the real Next.js request path.

`sendInboxWhatsAppReply()` sends to Meta before writing local outbound history. Therefore this 500 means the local persistence step failed after the send call; the customer message may already have been accepted by Meta even though the browser reported failure. Historical failed attempts must not be blindly resent because that could duplicate customer messages.

Supabase schema inspection confirmed:

- `whatsapp_messages.workspace_id` is `NOT NULL`;
- `whatsapp_messages(conversation_id, workspace_id)` must match `whatsapp_conversations(id, workspace_id)`;
- the Web Growth workspace remains internally consistent and no migration is missing.

### Exact request-boundary cause

The four interactive reply routes constructed:

`{ url: supabaseUrl, serviceRoleKey }`

and relied on `AsyncLocalStorage` established inside the awaited authentication helper to remain available later when the store was created.

That assumption is unsafe across the real awaited Next.js request boundary. The store can therefore resolve no runtime workspace even though `getWhatsAppWorkspaceAccess()` successfully returned `access.workspaceId`.

The same interactive pattern existed in:

- text replies;
- voice-note replies;
- media replies;
- saved replies;
- conversation-launched WhatsApp Flow outbound history.

Webhook processing already passed `workspaceId` explicitly and was not affected. Background automation processing retains its explicit `runWithWhatsAppWorkspace()` execution boundary.

### Builder failure

Source tracing also identified the remaining builder containment regression:

- `nav.ts` marked Automations and Flows as `layout: "fill"`;
- `WhatsAppShell.tsx` treats `fill` routes as `h-dvh overflow-hidden`;
- those builders contain content taller than the viewport and their own scrolling inspectors;
- the shell-level clipping prevented lower settings from being reached.

The intended contract is that only Conversations/Inbox uses the fill layout.

## Repairs

### Interactive outbound tenant scope

All authenticated interactive outbound routes now pass the already-resolved tenant explicitly:

`workspaceId: access.workspaceId`

This applies to:

- `/api/admin/whatsapp/reply/`;
- `/api/admin/whatsapp/reply/audio/`;
- `/api/admin/whatsapp/reply/media/`;
- `/api/admin/whatsapp/reply/saved-reply/`;
- `/api/admin/whatsapp/flows/send/` outbound-history persistence.

The store still supports trusted runtime workspace inheritance for background/webhook execution, but interactive request correctness no longer depends on `AsyncLocalStorage` escaping the authentication await boundary.

### Store fallback

`src/lib/whatsapp/store.ts` retains the earlier fallback behavior:

1. explicit valid `workspaceId` wins;
2. otherwise use the trusted runtime workspace when present.

The effective workspace is applied to tenant filters, mutation bodies, reply-context reads, quoted-message reads and workspace-aware contact conflict handling.

### Builder layout policy

`src/components/whatsapp/nav.ts` now restores:

- Conversations → `fill`;
- Automations → normal `scroll`;
- Flows → normal `scroll`.

The existing builder-specific inspector scrolling CSS remains in place for long desktop Properties panels.

## Regression tests and TDD evidence

### Interactive send regression

`src/components/whatsapp/stage12Regression.test.ts` now requires every authenticated interactive send route to pass `access.workspaceId` explicitly.

Red run `34125477380` on commit `628fb722faf67e780e23c3870bc1f1263afdb998` failed exactly as expected on `/api/admin/whatsapp/reply/` because the route still relied on runtime context.

After updating all interactive send routes, final code run `34125779702` on commit `ae51a6bc07b4d11e91b545c70d93a01b9b1f9041` passed the WhatsApp tests, TypeScript, scoped WhatsApp ESLint and the optimized production build.

### Store regression

`src/lib/whatsapp/storeWorkspaceContext.test.ts` continues to prove background/runtime workspace inheritance for outbound writes and reply-context reads.

### Builder regression

`src/components/whatsapp/stage12Regression.test.ts` also asserts:

- Conversations resolves to `fill`;
- Automations resolves to `scroll`;
- Flows resolves to `scroll`;
- Automation and Flow inspector-scrolling guards remain present.

Red builder run `34122864204` failed with `fill !== scroll`; green builder run `34123019638` passed the complete validation gate.

## Database / infrastructure

- No Supabase migration is required.
- No production Supabase data was modified by these repairs.
- `stage12-visual-redesign-v2` remains blocked from Vercel Git deployments.
- No second production deployment has been triggered.

## Release gate

Before the next production release:

1. run complete Stage 12 validation on this documentation-inclusive head;
2. confirm branch diff contains only the intended send, builder, test and documentation corrections;
3. confirm Vercel has not created a branch preview;
4. obtain explicit merge/deployment approval;
5. merge once to `main` and allow exactly one production deployment;
6. verify the deployment is READY;
7. perform one deliberate Owner text reply while watching `/api/admin/whatsapp/reply/` runtime logs;
8. confirm the route returns success and the outbound row is stored with the Web Growth `workspace_id`;
9. verify Automation and Flow lower Properties settings are reachable.