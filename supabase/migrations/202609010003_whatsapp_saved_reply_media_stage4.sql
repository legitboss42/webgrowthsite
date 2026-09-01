-- Stage 4D Saved Reply media metadata + private storage bucket.
-- Apply manually in the Supabase SQL editor after 202609010002.
-- Do NOT run supabase db push.

alter table public.whatsapp_quick_replies
  add column if not exists media_kind text,
  add column if not exists media_path text,
  add column if not exists media_filename text,
  add column if not exists media_mime_type text,
  add column if not exists media_size bigint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'whatsapp_quick_replies_media_kind_check'
      and conrelid = 'public.whatsapp_quick_replies'::regclass
  ) then
    alter table public.whatsapp_quick_replies
      add constraint whatsapp_quick_replies_media_kind_check
      check (media_kind is null or media_kind in ('image', 'video', 'document', 'audio'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'whatsapp_quick_replies_media_size_check'
      and conrelid = 'public.whatsapp_quick_replies'::regclass
  ) then
    alter table public.whatsapp_quick_replies
      add constraint whatsapp_quick_replies_media_size_check
      check (media_size is null or media_size > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'whatsapp_quick_replies_media_bundle_check'
      and conrelid = 'public.whatsapp_quick_replies'::regclass
  ) then
    alter table public.whatsapp_quick_replies
      add constraint whatsapp_quick_replies_media_bundle_check
      check (
        (
          media_kind is null and
          media_path is null and
          media_filename is null and
          media_mime_type is null and
          media_size is null
        )
        or
        (
          media_kind is not null and
          nullif(trim(media_path), '') is not null and
          nullif(trim(media_filename), '') is not null and
          nullif(trim(media_mime_type), '') is not null and
          media_size is not null
        )
      );
  end if;
end
$$;

create index if not exists whatsapp_quick_replies_media_path_idx
  on public.whatsapp_quick_replies (media_path)
  where media_path is not null;

insert into storage.buckets (id, name, public)
values ('whatsapp-saved-replies', 'whatsapp-saved-replies', false)
on conflict (id) do update
set public = false;
