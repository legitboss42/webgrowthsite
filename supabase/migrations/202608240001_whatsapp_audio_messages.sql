alter table public.whatsapp_messages
  add column if not exists media_id text,
  add column if not exists media_mime_type text,
  add column if not exists media_sha256 text,
  add column if not exists media_voice boolean not null default false,
  add column if not exists media_filename text;

create index if not exists whatsapp_messages_media_id_idx on public.whatsapp_messages (media_id);
