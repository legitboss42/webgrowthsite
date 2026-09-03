# Password reset auth repair — 2026-09-03

## Incident

Workspace password-reset requests reached `/api/auth/password/reset/` and returned HTTP 200, but no reset email appeared in Brevo transactional logs.

Supabase Auth logs showed the real failure at the same time:

- recovery link generation returned `404 user_not_found`
- the fallback invite-link generation then returned HTTP 500 because the email already existed in `auth.users`

The affected Auth rows had been inserted directly into `auth.users` / `auth.identities` and had `instance_id = null`. They existed in PostgreSQL but were not valid GoTrue-created Auth users, so the Auth API could not recover them normally.

## Production data repair

The three malformed Auth-only rows for the existing Web Growth accounts were removed from `auth.identities` and `auth.users` after confirming they had zero Auth sessions and only the manually-created email identity.

No Web Growth platform identities, workspace memberships, roles, CRM data, WhatsApp data, or tenant records were changed. Those records are stored separately from Supabase Auth.

The existing application flow can now allow Supabase Auth to create a valid user through its own Auth API when an authorized account requests password setup/reset.

## Code hardening

`src/app/api/auth/password/reset/route.ts` now:

- keeps the public anti-enumeration response generic (`{ ok: true }`)
- logs when Supabase fails to generate an action URL
- checks the return value from `sendTransactionalEmail()`
- logs `setup_required` or other non-submission states instead of silently pretending the message was submitted
- preserves thrown Brevo/API error logging

No email address is added to the new diagnostic log payloads.

## Deployment state

The code fix is intentionally held on branch `fix/password-reset-auth-flow` and has not been promoted to `main` or deployed. Production deployment must wait for explicit user approval.

## Rule going forward

Do not insert Supabase Auth users directly into the `auth` schema. Create/manage users through Supabase Auth APIs so GoTrue owns the full Auth record lifecycle.
