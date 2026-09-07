# WhatsApp regression repair — 2026-09-07

## Status

Implementation complete on the Vercel-blocked `stage12-visual-redesign-v2` branch. Production release is intentionally held until the full branch validation passes and the approved single merge/deployment is performed.

## Reported symptoms

- Inbox replies appeared unable to send.
- Workflow/automation Properties settings could not be scrolled reliably after the Stage 12 redesign.
- A wider regression audit was requested rather than treating those two symptoms in isolation.

## Production evidence

Vercel runtime errors identified `Supabase WhatsApp store request failed: 400` on the admin reply path. The failure occurred after the Meta send path when outbound history was being written.

Supabase production data confirmed the same error on recent automation `SEND_TEXT` runs. The affected Stage 11 tables require `workspace_id`, including `whatsapp_messages`, so unscoped outbound writes were rejected by PostgREST.

The automation processor endpoint itself continued returning HTTP 200 because an individual workflow run can fail while the queue processor completes normally. This made the runtime failure less obvious from cron health alone.

## Root causes

### 1. Missing tenant scope in the WhatsApp store

`getWhatsAppWorkspaceAccess()` and background processors correctly establish the trusted workspace through `AsyncLocalStorage`, but `createSupabaseWhatsAppStore()` and its reply-context helpers only respected an explicitly supplied `workspaceId` option.

Several valid call sites intentionally relied on the already-established request/runtime workspace and therefore created the store with only the Supabase URL and service-role key. The store then omitted `workspace_id` from outbound writes and tenant filters.

Affected paths included:

- inbox text replies
- voice-note replies
- media replies
- saved replies
- automation outbound messages
- Flow outbound history recording
- quoted/reply-context reads that should remain tenant scoped

### 2. Builder scroll containment introduced by the redesign

Stage 12 application surfaces use `overflow: hidden` to produce clean app panels. The Automation builder and WhatsApp Flow builder are exceptions because they contain their own canvas and Properties inspector scrolling.

The builder hosts inherited/clung to clipping containers, which trapped long inspector content and made lower workflow settings unreachable.

## Repair

### Tenant propagation

`src/lib/whatsapp/store.ts` now resolves its effective workspace in this order:

1. a valid explicitly supplied `workspaceId`, when present;
2. otherwise the trusted runtime workspace established by request authentication or background `runWithWhatsAppWorkspace()` execution.

That effective workspace is used for:

- tenant query filters;
- outbound/inbound mutation bodies;
- reply-context reads;
- quoted-message reads;
- workspace-aware contact conflict handling.

Explicit workspace IDs continue to take precedence, preserving webhook and test behavior.

### Builder scrolling

`stage12-overlap-fixes.css` now makes the Automation/Flow editor hosts visible rather than clipped and restores independent vertical scrolling for desktop Properties inspectors. The fix is intentionally scoped to the builder surfaces; inbox three-pane overflow behavior remains unchanged.

## Regression tests

Two test groups were added and included in `npm run test:whatsapp`:

- `src/lib/whatsapp/storeWorkspaceContext.test.ts`
  - proves outbound writes inherit runtime workspace scope;
  - proves reply-context reads inherit runtime workspace scope.
- `src/components/whatsapp/stage12Regression.test.ts`
  - guards Automation builder/Properties scrolling;
  - guards Flow builder/Properties scrolling.

### TDD evidence

The new store tests were first run against the old implementation and failed because generated Supabase URLs/bodies contained no `workspace_id`.

The scrolling guards were also introduced before the CSS repair and failed against the clipped Stage 12 builder structure.

After the production fixes, the WhatsApp suite reports 215 passing tests and 0 failures.

## Validation evidence before release

GitHub Actions Stage 12 validation run `34120461880` on commit `12cac7144f7692a5449a5d187afe3e464d544b79` completed successfully:

- `npm run test:whatsapp` — pass, 215/215
- `npx tsc --noEmit` — pass
- scoped WhatsApp ESLint — pass
- `npm run build` — pass

A final validation run is required on the documentation-inclusive branch head before merge.

## Database / infrastructure changes

- No Supabase migration was required.
- No production Supabase data was modified as part of the code repair.
- The repair branch is explicitly blocked from Vercel Git deployments.
- Production remains on the previous build until the approved single merge to `main`.

## Release verification

After the approved merge reaches production:

1. confirm the new Vercel deployment is READY and points to the merge commit;
2. smoke the WhatsApp console routes;
3. inspect production runtime errors for the repaired reply/store failure;
4. confirm the automation processor remains healthy;
5. confirm Supabase project health;
6. do not automatically resend historical failed messages or failed automation runs, because Meta may already have accepted a message before the old history-write failure occurred.

A real customer send is not performed automatically during release verification because that would create an external WhatsApp message. The Owner should verify one deliberate reply after release while runtime logs are observed.
