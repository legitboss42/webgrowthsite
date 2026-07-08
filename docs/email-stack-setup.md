# Web Growth Email Stack Setup

## Chosen Architecture

- Incoming mail: Namecheap email forwarding for `admin@webgrowth.info`
- Inbox: Gmail receives forwarded mail
- Outgoing transactional mail: Brevo free plan
- Website forms: Next.js API routes send via Brevo API
- Reply workflow: admin notifications use the lead's email as `replyTo`, and customer confirmations use `admin@webgrowth.info` as `replyTo`

This keeps the stack free while preserving a professional branded sender.

## Required Environment Variables

Add these to `.env.local` and the Vercel project environment settings:

```env
BREVO_API_KEY=
BREVO_FROM_EMAIL=admin@webgrowth.info
BREVO_FROM_NAME=Web Growth
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_BOOKING_URL=
```

## DNS And Provider Checklist

Configure and verify these in Namecheap and Brevo:

- MX records for the chosen receiving setup
- SPF record authorizing Brevo
- DKIM records supplied by Brevo
- DMARC record for `webgrowth.info`
- Forwarder from `admin@webgrowth.info` to the Gmail inbox you want to use daily

## Gmail Send-As

Inside Gmail:

1. Go to `Settings` -> `Accounts and Import`
2. Under `Send mail as`, add `admin@webgrowth.info`
3. Use the SMTP details from Brevo
4. Confirm the verification email sent to `admin@webgrowth.info`
5. Set the alias to reply from the same address by default

## Repo Coverage

The website currently has these active email flows:

- `/api/forms/notify` for website review and website build inquiries
- `/api/get-started` for the multi-step launch form

These routes now:

- send internal notifications to `admin@webgrowth.info`
- send confirmation emails back to the submitter
- preserve Turnstile, validation, origin checks, and rate limiting

## Current Non-Brevo Flows

- Lead magnet downloads still post to MailerLite-hosted form actions
- The homepage newsletter UI is still disabled and does not have a live backend route

If you want those migrated into the same inbox and provider flow, they should be moved in a separate scoped pass.
