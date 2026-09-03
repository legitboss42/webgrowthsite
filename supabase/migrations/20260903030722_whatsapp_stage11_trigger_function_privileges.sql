-- Stage 11: the platform-user binding trigger is SECURITY DEFINER and must not be callable through PostgREST.
revoke all on function public.whatsapp_stage11_bind_platform_user() from public;
revoke all on function public.whatsapp_stage11_bind_platform_user() from anon;
revoke all on function public.whatsapp_stage11_bind_platform_user() from authenticated;
grant execute on function public.whatsapp_stage11_bind_platform_user() to service_role;
