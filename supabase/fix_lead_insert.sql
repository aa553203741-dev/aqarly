-- إصلاح: سياسة إدراج طلب العميل للزائر
-- كانت تفشل (401) لأن فحص وجود الوسيط يقرأ profiles، والزائر ممنوع منه بـRLS.
-- وجود الوسيط مضمون أصلًا بالمفتاح الأجنبي broker_user_id → profiles(id).
-- الصقه في Supabase > SQL Editor ونفّذه. آمن ومتكرر.

drop policy if exists leads_insert_public on public.client_leads;
create policy leads_insert_public on public.client_leads
  for insert to anon, authenticated
  with check (status = 'new');
