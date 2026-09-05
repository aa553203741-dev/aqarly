-- إصلاح: توليد كود الوسيط بلا اعتماد على pgcrypto/extensions
-- (كان يفشل إنشاء الحساب بخطأ "Database error saving new user").
-- الصقه في Supabase > SQL Editor ونفّذه. آمن ومتكرر.

create or replace function public.gen_broker_code()
returns text language plpgsql as $$
declare c text; ok boolean;
begin
  loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    select not exists(select 1 from public.broker_codes where code = c) into ok;
    exit when ok;
  end loop;
  return c;
end $$;
