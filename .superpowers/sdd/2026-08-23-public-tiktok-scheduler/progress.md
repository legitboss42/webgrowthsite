# SDD ledger — plan: docs/superpowers/plans/2026-08-23-public-tiktok-scheduler.md

Baseline: `npm run test:scheduler` passed 37/37 on main at c6aae6b.
Execution location: main working tree by explicit user instruction; redundant linked worktrees removed after verifying their feature commits were ancestors of main.

## Preflight consistency scan

| Task(s) | Producer / consumer or internal check | Finding |
|---|---|---|
| 1 | Gate resolver, tests, config compatibility | Internally consistent; fail-closed dependency from public posting to Direct Post is explicit. |
| 2 | Migration fields/RPCs consumed by Tasks 3, 7, 8, 10, 11 | Internally consistent; additive-only migration is binding. |
| 3 | Legal state consumed by OAuth, dashboard, and later route guards | Internally consistent; Sandbox allowance must remain explicit and server-side. |
| 4 | Task 1 launch state drives landing/sign-in copy | Interface agrees; public copy must not infer approval from Direct Post alone. |
| 5 | Media policy and ordered assets consumed by Tasks 6 and 9 | Internally consistent; mixed photo/video rejection remains beta policy. |
| 6 | Video probe metadata stored for worker validation in Task 8 | Internally consistent; exact dependency version must be registry-verified if unavailable. |
| 7 | Atomic quota RPC from Task 2 consumed by schedule route | Interface agrees; advisory lock and ownership checks belong in the RPC. |
| 8 | Numbered retry RPC/fields from Task 2 consumed by worker/reconcile | Interface agrees; prior publish IDs are immutable and never cleared. |
| 9 | Durable workflow status consumed by polling UI | Internally consistent; scheduled time alone must never imply success. |
| 10 | Terminal timestamps from Tasks 2/8 drive retention | Interface agrees; cleanup must exclude active attempts. |
| 11 | Worker health table from Task 2 consumed by operations/admin | Interface agrees; admin aggregates cannot expose creator media or tokens. |
| 12 | Applies the single additive migration produced by Task 2 | Internally consistent; remote mutation is an external side effect and requires a current-state preflight. |
| 13 | Verifies integrated code from Tasks 1-11 | Internally consistent; deployment/push are external side effects and require an explicit checkpoint. |
| 14 | Uses deployed pre-launch system from Task 13 for Sandbox evidence/review | Internally consistent; TikTok submission is security/external-state sensitive and remains a checkpoint. |
| 15 | Consumes verified TikTok approval and Task 14 evidence | Internally consistent; public gates remain disabled until approval is independently verified. |
| 1 + 3 | `launch.ts` enrollment gate consumed by OAuth authorize route | Compatible. |
| 1 + 4 | `launch.ts` consumed by scheduler landing and sign-in | Compatible. |
| 1 + 6 | Video launch gate consumed by upload finalization | Compatible. |
| 1 + 7 | New-scheduling gate consumed by schedule route | Compatible. |
| 1 + 8 | Direct Post gate consumed by worker | Compatible; stopping new schedules and stopping publishing remain independent. |
| 2 + 3 | `scheduler_users` legal/suspension fields consumed by legal module/store | Compatible. |
| 2 + 7 | Quota RPC consumed by schedule route | Compatible. |
| 2 + 8 | Attempt numbering/retry RPC consumed by retry/worker | Compatible. |
| 2 + 10 | Terminal/deletion fields consumed by retention/account deletion | Compatible. |
| 2 + 11 | Worker-health schema consumed by operations/admin | Compatible. |
| 3 + 4 | Terms versions and acceptance UI link to scheduler terms page | Compatible. |
| 3 + 10 | Authenticated user/store contract consumed by deletion endpoint | Compatible. |
| 5 + 6 | Upload route is shared by photo and video policy | Compatible if Task 6 extends Task 5 without weakening photo validation. |
| 5 + 9 | Post media/order and durable post state rendered by detail UI | Compatible. |
| 6 + 8 | Validation version/metadata checked before worker submission | Compatible. |
| 7 + 8 | Schedule reservation creates work later claimed by worker | Compatible; quotas do not substitute for atomic worker claiming. |
| 8 + 9 | Retry/attempt states mapped to live polling presentation | Compatible. |
| 8 + 10 | Terminal reconciliation supplies retention timestamps and staging cleanup | Compatible. |
| 8 + 11 | Worker claims and outcomes feed heartbeat/admin aggregates | Compatible. |
| 9 + 13 | No-reload status UX receives rendered/browser verification | Compatible. |
| 10 + 11 | Cleanup counts feed operational aggregates | Compatible. |
| 12 + 13 | Remote schema verification precedes deployment verification | Compatible. |
| 13 + 14 | Pre-launch deployment precedes external TikTok review | Compatible. |
| 14 + 15 | Approval evidence precedes production activation | Compatible. |

Preflight result: no plan/spec contradiction found. External mutations in Tasks 12-15 remain explicit stop points under the execution workflow.

Task 1: Ruling: reviewer requested production wiring for public enrollment, video, and new scheduling — Task 1's specified interface is the resolver/assertion only, while the approved plan assigns boundary enforcement to Tasks 3, 6, 7, and 8; wiring those routes now would duplicate and preempt their test-first scopes — if wrong, later boundary tests may expose a missing call and require rework.
Task 1: minor (deferred): add a positive all-gates-enabled resolver test and a resolver-to-assertion integration case if final review judges them necessary.
Task 1: complete (commits c6aae6b..8f8d8ee, spec-compliant implementation; cross-task findings ruled, 2 minors deferred).
Task 2: Ruling: the plan's listed quota-RPC signature cannot atomically change a specific approved post because it lacks post and schedule inputs, while the binding spec and Task 7 require the RPC itself to perform the state transition — amend the local migration contract to accept the minimum post/schedule inputs and make the atomic mutation possible; if wrong, Task 7 callers and remote migration review will require a signature revision before application.
Task 2: Ruling: current worker incompatibility with numbered attempts is owned by Task 8 and the migration will not be applied until Task 12 after that integration — carry the mismatch forward as a blocking Task 8 requirement instead of altering the worker in Task 2; if wrong, applying the migration early would break retry lookup.
Task 2: fix round 1/5 (4 addressed, 0 open — atomic mutation, scheduling-event counting/fixed limits, structural safety tests, and user-leading index; commits 2bd9520..fbe3519).
Task 2: carry-forward to Task 8: replace fingerprint-only `maybeSingle()` attempt selection before numbered retries can be used.
Task 2: carry-forward to Task 12: execute migration and concurrent quota/retry verification against PostgreSQL/Supabase before remote rollout.
Task 2: complete (commits 8f8d8ee..fbe3519, re-review clean after round 1).
Task 3: Ruling: inactive-user enforcement at upload/post creation is assigned to Task 5, atomic scheduling enforcement to Task 7, and worker publication enforcement to Tasks 8/11; Task 3 must secure OAuth, callback persistence, legal acceptance, and dashboard only — duplicating later route/worker changes would preempt their test-first scopes — if wrong, a suspended account could retain a mutation path until the later tasks land, so the branch must not deploy before integrated verification.
Task 3: Ruling: direct executable route/worker suspension tests belong with the boundary implementations above; Task 3 will strengthen executable legal/OAuth/store coverage for the boundaries it owns — if wrong, source-contract tests may miss a framework-level authorization regression until final integration testing.
Task 3: fix round 1/5 (3 addressed, 1 open — active-session OAuth gate, atomic callback persistence, shared legal versions addressed; negative RPC refusal test open; commits 0b20b74..0effedb).
Task 3: fix round 2/5 (1 addressed, 0 open — conditional persistence refusal and no-direct-write regression; commits 0effedb..3ed036c).
Task 3: carry-forward to Task 12/13: apply and verify `save_active_tiktok_connection` migration before deploying callback code that depends on it.
Task 3: complete (commits fbe3519..3ed036c, re-review clean after round 2).
Task 4: fix round 1/5 (core branch/metadata/governance contracts addressed; rendered terms, landing CTA, and layout-nav binding open; commits fec70eb..78b508b).
Task 4: fix round 2/5 (rendered terms and layout navigation addressed; same-element landing CTA binding open; commits 78b508b..8aeeba0).
Task 4: fix round 3/5 (landing CTA text/href same-element binding addressed, 0 open; commits 8aeeba0..9c47101).
Task 4: minor (deferred): rendered desktop/narrow visual and focus check remains for Task 13.
Task 4: minor (deferred): repository SEO validation is blocked by 12 pre-existing ungoverned scheduler API routes; resolve or explicitly govern them before final SEO verification.
Task 4: complete (commits 3ed036c..9c47101, re-review clean after round 3).
Task 5: Ruling: unattached finalized assets from a stopped multi-upload are abandoned uploads owned by Task 10's 24-hour cleanup policy; Task 5 must stop post creation and report the file error but need not delete already-finalized assets synchronously — if wrong, storage can grow until retention is implemented, so the branch must not deploy before Task 10 verification.
Task 5: minor (deferred): add EXIF-rotation fixture and direct route/header integration coverage if final review finds current Sharp behavior tests insufficient.
Task 5: fix round 1/5 (3 addressed, 2 open plus new lock finding — atomic post/approval, active/legal approval gate, and error classification addressed; exact CAS, real adapter coverage, and media row locks open; commits 2080b09..2674649).
Task 5: fix round 2/5 (2 addressed, 1 open — exact owned-PENDING CAS and deterministic attachment/media locks addressed; checksum/storage adapter error coverage open; commits 2674649..d7a4347).
Task 5: fix round 3/5 (1 addressed, 0 open — bounded checksum and storage-stage error handling; commits d7a4347..56a3ad1).
Task 5: carry-forward to Task 12: execute PostgreSQL parsing and concurrent finalize/invalidate versus create/approve lock behavior before deployment.
Task 5: complete (commits 9c47101..56a3ad1, re-review clean after round 3).
Task 6: Ruling: the implementation may not narrow the approved MP4/MOV/WebM and supported-codec contract without a new user-approved design change; implement the approved container/codec set and accurate durable MIME — if wrong, beta scope and infrastructure costs expand beyond the intended H.264-only implementation.
Task 6: Ruling: Linux x64 packaged-binary execution and permission verification require the deployed/runtime environment and belong to Tasks 13/14; Task 6 must provide trace/config evidence and keep `SCHEDULER_VIDEO_ENABLED` false — if wrong, a packaging failure will surface only at deployment verification.
Task 6: fix round 1/5 (creator maximum, approved formats, bounded stream/temp/probe, exact messages, raw parser, schema contracts implemented; structural container evidence, true Supabase stream path, exact type anchoring, and refresh CAS remained open; commits f74f491..942a2f9).
Task 6: fix round 2/5 (direct response-body streaming, exact type contracts, functional refresh CAS addressed; major-brand MIME, EBML ID bounds, and secret-bearing URL CAS remained open; commits 942a2f9..6440ad0).
Task 6: fix round 3/5 (major-brand MIME, four-byte EBML IDs, and revoked server-side refresh CAS addressed, 0 open; commits 6440ad0..a0df6ae).
Task 6: carry-forward to Tasks 13/14: keep video disabled until Linux x64 FFprobe execution, execute permission, old-parser security review, and near-500-MiB `/tmp`/memory/timeout/concurrency load evidence pass.
Task 6: complete (commits 56a3ad1..a0df6ae, re-review clean after round 3).
Task 7: fix round 1/5 (locked exact legal/account authority, timezone RPC propagation, and boundary tests addressed; DST fold/gap conversion and service-role grant open; commits 4ff8842..4d3d46a).
Task 7: fix round 2/5 (candidate-based IANA resolution, wall-time/instant integrity, and exact service-role grant addressed, 0 open; commits 4d3d46a..daa4f24).
Task 7: carry-forward to Task 12: execute final five-argument RPC privileges and concurrent last-slot behavior against PostgreSQL/Supabase.
Task 7: carry-forward to Task 13: verify browser/server ICU timezone correspondence in target runtime.
Task 7: complete (commits a0df6ae..daa4f24, re-review clean after round 2).
Task 8: fix round 1/5 (database-authoritative submission, transactional publish/failure persistence, claim recovery, complete terminal allowlist, sanitized endpoint, and exact reconciliation addressed, 0 open; commits b236325..b52f260).
Task 8: carry-forward to Task 12: parse/apply/test submission, publish-ID, failure, retry, and claim RPC privileges/locks/idempotency under real PostgreSQL concurrency.
Task 8: carry-forward to Tasks 14/15: verify live TikTok acceptance, reconciliation, and documented terminal codes without enabling blind retry.
Task 8: complete (commits daa4f24..b52f260, re-review clean after round 1).
Task 9: fix round 1/5 (exhaustive routing, retry matrix, polling state machine, status snapshots addressed; persisted approved substate, terminal listener, approval prop serialization, and executable retry/focus open; commits 6f312c7..e2a45e5).
Task 9: fix round 2/5 (reload-safe approval substate, terminal cleanup, narrow client props, and executable retry runner addressed, 0 open; commits e2a45e5..0af7093).
Task 9: carry-forward to Task 13: rendered desktop/narrow, keyboard focus, live-region, hidden-tab, and no-reload status verification.
Task 9: complete (commits b52f260..0af7093, re-review clean after round 2).
Task 10: Ruling: disposable PostgreSQL concurrency/cascade/privilege execution is mandatory but belongs to Task 12 after the final additive migration is ready; Task 10 must add structural and executable adapter/policy tests now and cannot claim database-runtime verification — if wrong, a SQL race or privilege defect may survive until migration preflight, where deployment must stop.
Task 10: fix round 1/5 (4 addressed, 1 open — attach serialization, account deletion ambiguity, staging cleanup, strict storage path validation, and accessible notices addressed; original-media cleanup still missed unresolved no-publish-id provider ambiguity; commits c0ec309..100cd82).
Task 10: fix round 2/5 (1 addressed, 1 open — original-media cleanup protected unresolved no-publish-id ambiguity; safe FAILED_RETRYABLE retry history then over-blocked retention; commits 100cd82..d13b8a3).
Task 10: fix round 3/5 (1 addressed, 0 open — safe retry history released while active, ambiguous, and incomplete publish-ID provider work stays protected; commits d13b8a3..194376c).
Task 10: carry-forward to Task 12: execute PostgreSQL concurrency/cascade/stale-takeover/privilege cases for retention, cleanup, and account deletion before deployment.
Task 10: carry-forward to Task 13: rendered settings/account-deletion/disconnect notices need desktop/narrow accessibility verification.
Task 10: complete (commits 0af7093..194376c, re-review clean after round 3).
Task 11: fix round 1/5 (4 addressed, 1 open — cleanup/reconnect/admin aggregates, strict health-code allowlist, preserved failure-on-start, and privileged route coverage addressed; invalid Next route-module test-factory exports introduced; commits 0d8c927..58cf0ac).
Task 11: fix round 2/5 (1 addressed, 0 open — route handler factories moved to sibling module and route modules export only POST; commits 58cf0ac..0994ba5).
Task 11: carry-forward to Task 12: execute PostgreSQL fairness/concurrency/privilege/aggregate behavior for claim, heartbeat, owner aggregate, suspend, and restore RPCs before deployment.
Task 11: carry-forward to Task 13: rendered owner dashboard, controls, no-secret/no-media display, and disabled-gate heartbeat behavior need browser verification.
Task 11: complete (commits 194376c..0994ba5, re-review clean after round 2).

Task 12: the earlier alleged quota race was traced to an invalid fixture with zero used daily slots; a corrected pre-fix two-backend test with two used slots proved the existing advisory/user-row locks already admit exactly one final request. The real migration defect was legacy scheduled rows left with `scheduled_at IS NULL`, making them invisible to the rolling daily count. Executable RED was first=true/second=true; `202608280001` backfilled those rows, and its immediate live check exposed an over-broad fallback that made first=false/second=false. The already-applied file remained immutable, and the separately authorized `202608280002` narrowed fallback counting to rows with scheduling evidence. Both corrections were applied through isolated dry-runs/pushes that listed only the scheduler file; no pending WhatsApp migration was applied. Final live regression exited 0, the bounded two-backend fixture settled at one `SCHEDULED` and one `NEEDS_APPROVAL` with no active fixture query, the remaining reservation returned false, and exact cleanup returned users/posts/approvals/attempts all zero. The linked ledger matches both corrections; live ACL/search-path/locking checks passed; scheduler tests are 280/280, TypeScript and `git diff --check` exit 0. Push and deployment remain unperformed.
