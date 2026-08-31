-- Remove legacy rows that were accidentally created from ordinary WhatsApp
-- message delivery-status webhooks. Real Calling API rows store the raw call
-- object, which includes an `event` field; message status objects instead carry
-- `status` + `recipient_id` and must never live in whatsapp_calls.
delete from public.whatsapp_calls
where raw is not null
  and jsonb_typeof(raw) = 'object'
  and raw ? 'status'
  and raw ? 'recipient_id'
  and not (raw ? 'event');
