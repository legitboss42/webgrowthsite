-- Sanitized failure reason for an outbound WhatsApp message.
--
-- Written only when Meta's status webhook reports `failed`, and only ever as plain
-- English produced by sanitizeWhatsAppStatusError() — never a raw provider payload,
-- trace id, or token. Additive and idempotent: existing rows keep a null reason, and
-- the app already runs correctly without this column.
alter table public.whatsapp_messages
  add column if not exists delivery_error text;

-- Failed messages are the ones an administrator goes looking for.
create index if not exists whatsapp_messages_failed_idx
  on public.whatsapp_messages (conversation_id, message_timestamp desc)
  where delivery_status = 'failed';
