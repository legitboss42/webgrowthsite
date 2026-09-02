-- A browser may subscribe to more than one client workspace, and identical Meta message
-- ids must never make one tenant suppress another tenant's notification.
alter table public.whatsapp_push_subscriptions drop constraint if exists whatsapp_push_subscriptions_endpoint_key;
alter table public.whatsapp_push_subscriptions add constraint whatsapp_push_subscriptions_workspace_endpoint_key unique (workspace_id, endpoint);

alter table public.whatsapp_push_deliveries drop constraint if exists whatsapp_push_deliveries_pkey;
alter table public.whatsapp_push_deliveries add constraint whatsapp_push_deliveries_pkey primary key (workspace_id, message_id);

create index if not exists whatsapp_push_subscriptions_workspace_updated_idx on public.whatsapp_push_subscriptions (workspace_id, updated_at desc);
