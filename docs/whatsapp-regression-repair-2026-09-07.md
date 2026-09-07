# WhatsApp regression repair — 2026-09-07

## Current status

The first production repair restored tenant-scoped outbound history writes, but the reported Automation/Flow builder scrolling problem remained. A second root-cause investigation identified the remaining failure and corrected it on the Vercel-blocked `stage12-visual-redesign-v2` branch.

No second production deployment has been made. The corrected branch is being held for explicit release approval.

## Reported symptoms

- Inbox replies had appeared unable to send because outbound history persistence failed after Meta send handling.
- Workflow/Automation Properties settings could not be reached reliably after the Stage 12 redesign.
- WhatsApp Flow builder settings showed the same clipping pattern.

## Production evidence

### Reply/store failure

Vercel runtime errors identified `Supabase WhatsApp store request failed: 400` on `/api/admin/whatsapp/reply`. The failure occurred when outbound history was written without the Stage 11 `workspace_id` tenant key.

The first repair fixed that data-path regression and shipped in merge commit `a4a0dd0ceca953e238059451979e6480c1aa98b1` through production deployment `dpl_5ESYAEAuvrgR9Lt7PwU7VegGuwiN`.

### Builder failure after the first repair

After that deployment was READY, production request activity showed the Owner opening `/admin/whatsapp/automations/` and `/admin/whatsapp/flows/`. No new `/api/admin/whatsapp/reply` request occurred during that verification window, so the remaining reported failure was in the builder UI rather than the reply path.

Source tracing then identified the actual containment regression:

- `nav.ts` marked **Automations** and **Flows** as `layout: "fill"`.
- `WhatsAppShell.tsx` treats `fill` routes as `h-dvh overflow-hidden` and also clips `wg-app-content`.
- Automation and Flow builders contain content taller than the available viewport and their own sticky/scrolling inspector areas.
- An ancestor `overflow-hidden` clips those builders before the lower Properties controls can become reachable.

The repository's earlier layout contract already documented the intended rule: **only Conversations/Inbox fills the viewport; other pages scroll normally.**

## Root causes

### 1. Missing tenant scope in the WhatsApp store

`getWhatsAppWorkspaceAccess()` and background processors establish a trusted workspace through runtime context, but `createSupabaseWhatsAppStore()` originally used only an explicitly supplied `workspaceId`.

Valid call sites relying on the trusted runtime workspace therefore omitted `workspace_id` from writes and tenant filters.

Affected paths included inbox text/audio/media/saved replies, automation outbound messages, Flow outbound history, and reply-context/quoted-message reads.

### 2. Wrong shell layout mode for builders

The Stage 12 redesign changed Automations and Flows from normal page scrolling to the Inbox-only `fill` layout. That caused the shell itself to clip the builder viewport. The first CSS-only repair changed child overflow rules, but a child cannot escape an ancestor that still clips the entire page.

That is why the first scrolling patch passed source-level tests yet did not solve the live behavior.

## Repairs

### Tenant propagation

`src/lib/whatsapp/store.ts` now resolves the effective workspace in this order:

1. a valid explicit `workspaceId` when supplied;
2. otherwise the trusted runtime workspace established by authenticated request/background execution.

The effective workspace is applied to tenant filters, mutation bodies, reply-context reads, quoted-message reads, and workspace-aware contact conflict handling.

### Builder layout policy

`src/components/whatsapp/nav.ts` now restores the intended application contract:

- Conversations: `layout: "fill"`
- Automations: normal `scroll`
- Flows: normal `scroll`

This removes the shell-level `overflow-hidden` ancestor from Automation/Flow routes while preserving the Inbox's independent three-pane scrolling.

The existing builder-specific inspector scrolling CSS remains in place so long Properties panels can still scroll independently on desktop.

## Regression tests and TDD evidence

### Tenant regression tests

`src/lib/whatsapp/storeWorkspaceContext.test.ts` proves outbound writes and reply-context reads inherit the trusted runtime workspace.

### Builder regression tests

`src/components/whatsapp/stage12Regression.test.ts` now asserts the actual layout behavior, not merely the presence of CSS selectors:

- Conversations resolves to `fill`.
- Automations resolves to `scroll`.
- Flows resolves to `scroll`.
- Automation and Flow inspector-scrolling guards remain present.

Red run `34122864204` on commit `13f109537e1997d8d8e379ca269b3dfc3093dd92` failed exactly as expected with `fill !== scroll` for the builder route.

Green run `34123019638` on commit `84e9692a0c197838938e6e0affb265cab326f331` passed the WhatsApp tests, TypeScript, scoped WhatsApp ESLint, and the optimized production build.

## Database / infrastructure

- No new Supabase migration is required.
- No production Supabase data was changed by the builder correction.
- Supabase project remains separate from this frontend layout repair.
- `stage12-visual-redesign-v2` remains blocked from Vercel Git deployments in `vercel.json`.
- No second production deployment has been triggered.

## Release gate

Before a second production release:

1. run the complete Stage 12 validation on the documentation-inclusive head;
2. confirm the branch is still ahead of `main` only by the intended builder correction/test/docs commits;
3. confirm Vercel has not created a branch preview;
4. obtain explicit deployment approval;
5. merge once and allow exactly one production deployment;
6. verify the production deployment is READY;
7. have the Owner open an Automation workflow and a WhatsApp Flow and confirm lower Properties settings are reachable.
