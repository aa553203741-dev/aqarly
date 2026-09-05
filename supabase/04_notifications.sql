-- ============================================================
--  عقارلي — ترقية: إشعار الوسيط بواتساب عند وصول طلب جديد
--  نفّذه بعد schema.sql.
--
--  الآلية: تريغر AFTER INSERT على client_leads يرسل الصف إلى نقطة
--  النهاية /api/notify/lead في تطبيقك عبر pg_net، وهي بدورها ترسل
--  رسالة واتساب للوسيط. الإرسال غير متزامن فلا يبطّئ حفظ الطلب.
--
--  ⚠️ قبل التنفيذ بدّل القيمتين أدناه:
--     • YOUR-DOMAIN         → نطاق تطبيقك (مثال: https://aqarly.com)
--     • YOUR_NOTIFY_SECRET  → نفس قيمة NOTIFY_WEBHOOK_SECRET في .env
--
--  بديل بلا SQL: Supabase Dashboard > Database > Webhooks > New webhook
--     الجدول client_leads، الحدث INSERT، النوع HTTP POST،
--     الرابط .../api/notify/lead، ورأس x-notify-secret بالقيمة نفسها.
-- ============================================================

create extension if not exists pg_net;

create or replace function public.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url     := 'https://YOUR-DOMAIN/api/notify/lead',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-notify-secret', 'YOUR_NOTIFY_SECRET'
               ),
    body    := to_jsonb(new)
  );
  return new;
exception when others then
  -- لا نُفشل إدراج الطلب إطلاقًا بسبب خطأ في الإشعار
  return new;
end $$;

drop trigger if exists trg_notify_new_lead on public.client_leads;
create trigger trg_notify_new_lead
  after insert on public.client_leads
  for each row execute function public.notify_new_lead();
