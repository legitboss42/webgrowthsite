-- Stage 11: make the inbox-state view tenant-addressable and tenant-safe.
create or replace view public.whatsapp_conversation_inbox_state
with (security_invoker = true)
as
select
  c.id as conversation_id,
  coalesce(unread.unread_count, 0)::bigint as unread_count,
  latest.id as latest_message_row_id,
  latest.whatsapp_message_id as latest_message_id,
  latest.direction as latest_direction,
  latest.message_type as latest_message_type,
  latest.message_text as latest_message_text,
  latest.message_timestamp as latest_message_timestamp,
  latest.media_voice as latest_media_voice,
  latest.media_filename as latest_media_filename,
  c.workspace_id
from public.whatsapp_conversations c
left join lateral (
  select count(*)::bigint as unread_count
  from public.whatsapp_messages m
  where m.conversation_id = c.id
    and m.workspace_id = c.workspace_id
    and m.direction = 'inbound'
    and (c.last_read_at is null or m.message_timestamp > c.last_read_at)
) unread on true
left join lateral (
  select
    m.id,
    m.whatsapp_message_id,
    m.direction,
    m.message_type,
    m.message_text,
    m.message_timestamp,
    m.media_voice,
    m.media_filename
  from public.whatsapp_messages m
  where m.conversation_id = c.id
    and m.workspace_id = c.workspace_id
  order by m.message_timestamp desc, m.created_at desc
  limit 1
) latest on true;

revoke all on public.whatsapp_conversation_inbox_state from anon, authenticated;
grant select on public.whatsapp_conversation_inbox_state to service_role;
