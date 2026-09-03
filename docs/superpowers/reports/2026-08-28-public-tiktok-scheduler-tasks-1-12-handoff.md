# Public TikTok Scheduler — Tasks 1–12 Handoff

Date: 2026-08-28  
Repository: `C:\Users\HomePC\Documents\Web Growth\webgrowth-info`  
Branch: `main`  
Plan: `docs/superpowers/plans/2026-08-23-public-tiktok-scheduler.md`  
Design: `docs/superpowers/specs/2026-08-23-public-tiktok-scheduler-design.md`

## Executive status

Tasks 1 through 12 of the approved public TikTok scheduler plan are implemented. The application code, database contract, retention controls, retry model, operational controls, and live Supabase scheduler migrations have been completed and verified. Task 12 received an independent final review with no findings.

Work stops here by owner instruction. Tasks 13 through 15 have not started in this continuation. The scheduler implementation has not been pushed in commit `80bfc41`, deployed from that commit, submitted to TikTok for production review, approved by TikTok, or opened for public enrollment.

Current Git state:

- `main` is one commit ahead of `origin/main` at `80bfc41 Fix scheduler legacy quota accounting`.
- No push or deployment was performed after Task 12.
- Unrelated untracked WhatsApp handoff artifacts remain untouched:
  - `.artifacts/whatsapp-console-handoff.html`
  - `docs/whatsapp-handoff-guide.md`

## What was implemented

### Task 1 — Fail-closed launch gates

- Added independent gates for public enrollment, Direct Post, public visibility, video uploads, and new scheduling.
- Enforced the dependency that public visibility cannot activate while Direct Post is disabled.
- Default configuration remains fail-closed.
- Commit: `8f8d8ee`.

### Task 2 — Public scheduler database contract

- Added the additive public scheduler schema covering users, legal acceptance, media, ordered post media, approvals, numbered attempts, worker health, retention, deletion, quotas, and privileged RPCs.
- Added ownership, locking, RLS, indexes, service-role-only functions, and atomic state transitions.
- Corrected the quota RPC contract so it can atomically schedule a specific owned and approved post.
- Commits: `2bd9520`, `fbe3519`.

### Task 3 — OAuth, account state, and legal acceptance

- Gated enrollment and OAuth by launch state and scheduler account status.
- Added current Terms and Privacy acceptance requirements.
- Hardened callback token persistence so suspended or deletion-requested users cannot be reactivated by a callback race.
- Preserved an explicit server-side TikTok Sandbox allowance without opening general enrollment.
- Commits: `0b20b74`, `0effedb`, `3ed036c`.

### Task 4 — Public pre-launch pages and truthful messaging

- Added scheduler landing, sign-in, terms, metadata, canonical, navigation, and route-governance coverage.
- Kept public copy truthful: Direct Post availability, TikTok approval, and public enrollment are represented as separate states.
- Strengthened rendered CTA and legal-content contracts.
- Commits: `fec70eb`, `78b508b`, `8aeeba0`, `9c47101`.

### Task 5 — Photo uploads and ordered media

- Added authenticated multi-file upload flow with TikTok photo limits, checksum handling, decoded-format validation, ownership checks, and ordered media attachment.
- Enforced a maximum of ten photos, rejected mixed photo/video posts, and made post creation and approval atomic.
- Added deterministic row locking and compare-and-set behavior to prevent cleanup/finalization races.
- Sanitized upload-stage infrastructure errors.
- Commits: `2080b09`, `2674649`, `d7a4347`, `56a3ad1`.

### Task 6 — Stored-object video validation

- Added fixed-argument, no-shell FFprobe execution using pinned `ffprobe-static`.
- Added streaming download, temporary-file cleanup, byte counting, container/codec evidence, dimensions, frame rate, duration, and creator-duration validation.
- Supported the approved MP4/MOV/WebM and codec policy while rejecting ambiguous or malformed evidence.
- Secured creator-info refresh using a revoked service-role RPC and compare-and-set persistence.
- Video remains independently fail-closed until runtime verification and activation.
- Commits: `f74f491`, `942a2f9`, `6440ad0`, `a0df6ae`.

### Task 7 — Atomic quotas and timezone-safe scheduling

- Added a rolling 24-hour daily limit of three scheduled events and an active-future-post limit of twenty.
- Enforced quotas inside one database transaction with same-user advisory locking, account/legal rechecks, approval locks, and the final state transition.
- Added IANA timezone conversion and DST gap/fold validation while preserving the submitted local time and zone.
- Owner-shaped IDs do not bypass public limits.
- Commits: `4ff8842`, `4d3d46a`, `daa4f24`.

### Task 8 — Durable numbered retries

- Added immutable numbered attempts instead of cloning posts or clearing history.
- Distinguished safe pre-acceptance automatic retries, explicit creator retries for proven terminal media failures, and non-retryable ambiguous/provider-accepted states.
- Preserved every historical `publish_id` and made submission, publish-ID persistence, failure persistence, and retry allocation transactional.
- Prevented blind duplicate submission when a publish ID exists.
- Commits: `b236325`, `b52f260`.

### Task 9 — Durable no-reload status UX

- Added owned, allowlisted status snapshots and a bounded polling state machine.
- Polling pauses while hidden, avoids overlap, keeps one absolute timeout, and refreshes only when durable state changes.
- Added truthful presentation for scheduled, submitting, processing, published, needs-attention, and retry states.
- Restored approval state safely after refresh and added accessible retry announcements/focus behavior.
- Commits: `6f312c7`, `e2a45e5`, `0af7093`.

### Task 10 — Retention, disconnect, and account deletion

- Added abandoned-upload, terminal-original, and staging cleanup policies with active/provider-ambiguity protection.
- Added exact storage namespace validation, claim/revalidation, partial-failure recovery, and idempotent cleanup.
- Added atomic disconnect that cancels only safe pre-submission jobs.
- Added explicit account deletion request flow using `DELETE MY SCHEDULER ACCOUNT`, dependency-ordered cleanup, and a rule that Web Growth never deletes an already-recorded TikTok post from TikTok.
- Commits: `c0ec309`, `100cd82`, `d13b8a3`, `194376c`.

### Task 11 — Fair worker execution and owner operations

- Added fair due-job claiming capped at two posts per creator while other creators have due work.
- Added sanitized worker heartbeat lifecycle and health codes.
- Added owner-only aggregate operations without encrypted tokens or media content.
- Added exact owner-authorized suspend and restore endpoints.
- Corrected cleanup/reconnect aggregates and Next.js route-module export safety.
- Commits: `0d8c927`, `58cf0ac`, `0994ba5`.

### Task 12 — Live Supabase migration and verification

- Repaired missing local history for the already-remote WhatsApp audio migration without changing its SQL: `a394f4e`.
- Applied `202608230001_public_scheduler_beta.sql` to the linked Supabase project using the explicitly approved `--include-all` path after dry-run confirmed the intended scheduler migration.
- Found and corrected a pinned-search-path pgcrypto reference with forward migration `202608240002_public_scheduler_pgcrypto_search_path.sql`: `39676b6`.
- Verified scheduler columns, indexes, RLS, security-definer functions, fixed search paths, revokes/grants, ownership locks, fairness, stale-takeover predicates, and rollback-safe quota/retry behavior.
- Found the real legacy quota defect: older scheduled posts had `scheduled_at IS NULL`, so they did not consume the rolling daily allowance.
- Added executable SQL regression coverage and two immutable forward corrections:
  - `202608280001_public_scheduler_legacy_quota.sql`
  - `202608280002_public_scheduler_legacy_quota_fallback.sql`
- The second migration narrows the fallback to rows with actual scheduling evidence and does not count fresh unscheduled candidates.
- Applied each correction through an isolated dry-run/push that listed only that scheduler migration. No pending WhatsApp migration was applied.
- Commit: `80bfc41`.

## Task 12 verification evidence

- Linked migration ledger includes `202608230001`, `202608240002`, `202608280001`, and `202608280002` on both local and remote sides.
- Live catalog audit passed:
  - expected scheduler columns: 39/39
  - expected indexes: 8/8
  - expected functions: 28/28
  - RLS enabled on all expected scheduler tables
  - no checked search-path, ACL, locking, fairness, or stale-takeover failures
- `reserve_public_scheduler_slot` remains `SECURITY DEFINER`, uses `search_path=public`, takes same-user advisory and row locks, and is executable only by `service_role`.
- Legacy quota regression is green.
- Correctly seeded two-backend final-slot verification produced one scheduled candidate and one unchanged `NEEDS_APPROVAL` candidate; a subsequent reservation was refused.
- Verification fixture cleanup returned zero users, posts, approvals, attempts, and worker rows.
- Final scheduler suite: 280 tests passed, 0 failed.
- Focused final independent migration review: 15 tests passed, 0 failed.
- TypeScript: exit 0.
- `git diff --check`: exit 0.
- Independent Task 12 review: no critical, high, medium, or low findings.

Residual limitation: the concurrent CLI output collector timed out, so the result was proved by persisted state under the database locks rather than by retaining both process output streams. The independent reviewer considered the persisted-state proof technically sufficient and confirmed zero residue.

## Migration-history warning outside TikTok scope

The repository currently has later WhatsApp migration-history irregularities that Task 12 deliberately did not alter:

- two local files share version `202608250001`;
- one remote `202608250001` ledger entry maps to `automation_waitlist`;
- local `202608260001` and `202608260002` are not recorded in the remote migration ledger;
- live database inspection shows some corresponding WhatsApp artifacts already exist off-ledger.

Do not run a broad Supabase push until that WhatsApp migration history is separately reconciled. Task 12 used isolated scheduler-only migration directories to avoid applying or rewriting those files.

## Security and product guarantees now present

- Public enrollment and public visibility remain independent and fail-closed.
- TikTok Sandbox/private posting does not imply production approval.
- Tokens remain server-side and are excluded from owner dashboard projections.
- Scheduler data is user-isolated through ownership checks and RLS.
- Provider acceptance ambiguity never triggers blind duplicate posting.
- Successful UI state is based on durable post state, not elapsed time or a scheduled timestamp.
- Users can disconnect and request deletion; cleanup preserves unresolved provider work and never removes already-published TikTok content from TikTok.
- Quotas and retry allocation are database-atomic.
- Worker claims are fair across creators and operational errors are sanitized.

## Not completed — stop boundary

### Task 13 — Full product verification and pre-launch deployment

Not started in this continuation. Still required:

- full lint, SEO validation, and production build on the final integrated commit;
- rendered desktop/narrow browser verification of every scheduler state and control;
- runtime FFprobe/Linux packaging and resource checks;
- push `80bfc41` (and any later approved verification-only fix) to `origin/main`;
- verify the resulting Vercel deployment and live commit;
- verify production remains fail-closed with public enrollment and public posting disabled.

### Task 14 — TikTok Sandbox evidence and production application

Not started. Still required:

- record valid private photo and video publication evidence;
- record the complete review walkthrough;
- minimize requested TikTok scopes;
- obtain explicit owner confirmation immediately before submitting the external production-review form;
- report the application as pending until TikTok actually approves it.

### Task 15 — Production activation after TikTok approval

Not started and must not be attempted before verified approval. Still required:

- confirm approved products, scopes, redirect URI, and URL properties;
- transfer production credentials securely to Vercel;
- run owner-controlled private production smoke tests;
- enable public visibility for one controlled approved-option smoke test;
- open self-service enrollment only after the production smoke test passes;
- complete a final launch audit that reports code, Git, database, deployment, approval, credentials, public posting, enrollment, quotas, cleanup, and monitoring separately.

## Recommended resume order

1. Preserve the current untracked WhatsApp handoff artifacts.
2. Reconcile the separate WhatsApp migration-history irregularities before any broad database push.
3. Review and push `80bfc41` to `origin/main` when authorized to resume Task 13.
4. Run the complete Task 13 local and rendered verification suite.
5. Deploy only in pre-launch/fail-closed mode.
6. Gather TikTok Sandbox evidence.
7. Obtain explicit confirmation immediately before TikTok production submission.
8. Wait for and independently verify approval before Task 15 activation.

## Final checklist at stop

- [x] Tasks 1–11 implemented and reviewed.
- [x] Task 12 live scheduler migrations applied and verified.
- [x] Legacy rolling-quota defect corrected with forward-only migrations.
- [x] Scheduler tests pass 280/280.
- [x] TypeScript and whitespace validation pass.
- [x] Live verification fixtures removed.
- [x] Independent Task 12 review clean.
- [x] Unrelated WhatsApp artifacts preserved.
- [ ] Task 12 final commit pushed.
- [ ] Task 13 full rendered/build/deployment verification.
- [ ] TikTok production application submitted or approved.
- [ ] Public TikTok posting enabled.
- [ ] Public self-service enrollment enabled.

