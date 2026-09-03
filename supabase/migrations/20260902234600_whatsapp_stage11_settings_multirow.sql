-- Stage 11: whatsapp_settings stores multiple named documents per workspace (default + quick-controls).
alter table public.whatsapp_settings drop constraint if exists whatsapp_settings_single_row;
alter table public.whatsapp_settings add constraint whatsapp_settings_id_nonempty check (char_length(trim(id)) between 1 and 64);
create index if not exists whatsapp_settings_workspace_updated_idx on public.whatsapp_settings (workspace_id, updated_at desc);
