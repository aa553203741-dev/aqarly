-- ============================================================
--  عقارلي — تريغر إشعار واتساب (جاهز بقيمك الفعلية)
--  الصقه في Supabase > SQL Editor ونفّذه.
-- ============================================================

create extension if not exists pg_net;

create or replace function public.notify_new_lead()
returns trigger language plpgsql security definer
set search_path = public, extensions as $$
begin
  perform net.http_post(
    url     := 'https://aqarly.vercel.app/api/notify/lead',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-notify-secret', '1d2d5d72d70db21fe924725a9153600bdd5594842bd48de7'
               ),
    body    := to_jsonb(new)
  );
  return new;
exception when others then
  return new;  -- الإشعار لا يُفشل حفظ الطلب أبدًا
end $$;

drop trigger if exists trg_notify_new_lead on public.client_leads;
create trigger trg_notify_new_lead
  after insert on public.client_leads
  for each row execute function public.notify_new_lead();
