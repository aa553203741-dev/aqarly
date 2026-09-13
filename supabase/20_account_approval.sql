-- ============================================================
--  عقارلي — المرحلة 20: موافقة الأدمن على الحسابات الجديدة
--
--  المشكلة التي يعالجها هذا الملف:
--  كان /signup مفتوحًا للجميع، وكود الدعوة اختياريًا. أي شخص يفتح
--  الرابط كان:
--    1) يُنشئ حسابًا،                     (صفحة signup مفتوحة)
--    2) يصبح دوره 'broker' تلقائيًا،       (profiles.role default)
--    3) يُضاف إلى أول منشأة في orgs،        (set_profile_org)
--    4) فيقرأ كل المخزون عبر RLS،          (org_id = current_org())
--    5) ويملك can_reserve = true افتراضيًا. (user_permissions default)
--
--  الحل: حالة اعتماد على profiles، وكل الدوال التي تبني عليها سياسات
--  RLS تتحقق منها. حساب بلا اعتماد => current_org() = NULL => لا يرى صفًا واحدًا.
--
--  نفّذه بعد 15_invites.sql. آمن ومتكرر (idempotent).
-- ============================================================

-- ------------------------------------------------------------
--  1) حالة الاعتماد
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'pending',
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('pending','active','rejected'));
  end if;
end $$;

create index if not exists idx_profiles_status on public.profiles(status);

-- ------------------------------------------------------------
--  2) ردم الحسابات القائمة
--
--  الأدمن فقط يُفعَّل تلقائيًا — وإلا أقفلتَ على نفسك الباب.
--  بقية الحسابات تبقى pending حتى تراجعها بنفسك: هذا مقصود، لأن
--  الدخيل موجود بينها الآن ولا سبيل للتمييز آليًا.
-- ------------------------------------------------------------
update public.profiles set status = 'active', approved_at = now()
  where role = 'admin' and status <> 'active';

-- بعد أن تراجع القائمة (استعلام المراجعة في آخر الملف)، فعّل فريقك:
--   update public.profiles set status='active', approved_at=now()
--     where id in ('<uuid>', '<uuid>');

-- ------------------------------------------------------------
--  3) تحصين الدوال التي تعتمد عليها سياسات RLS
--
--  هذه هي النقطة الجوهرية: لم نلمس أي سياسة RLS. كلها تقارن
--  org_id = current_org()، فيكفي أن تُرجع current_org() القيمة NULL
--  للحساب غير المعتمد حتى تُغلق كل الجداول دفعة واحدة.
-- ------------------------------------------------------------
create or replace function public.current_org()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.profiles
   where id = auth.uid() and status = 'active';
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
  );
$$;

-- can_reserve كان default true — فكان الدخيل يستطيع الحجز لا القراءة فقط.
create or replace function public.has_perm(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when not exists (
      select 1 from public.profiles
       where id = auth.uid() and status = 'active'
    ) then false
    when public.is_admin() then true
    else coalesce((
      select case p
        when 'can_reserve'              then can_reserve
        when 'can_process_payments'     then can_process_payments
        when 'can_close_deals'          then can_close_deals
        when 'can_manage_inventory'     then can_manage_inventory
        when 'can_view_all_commissions' then can_view_all_commissions
        else false end
      from public.user_permissions where user_id = auth.uid()
    ), case when p = 'can_reserve' then true else false end)
  end;
$$;

-- المستخدم يقرأ ملفه الشخصي (ليعرف أنه قيد المراجعة)، والأدمن يقرأ الكل.
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- لا يغيّر أحد حالته أو دوره بنفسه.
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and status = (select status from public.profiles where id = auth.uid())
    and role   = (select role   from public.profiles where id = auth.uid())
    and org_id is not distinct from (select org_id from public.profiles where id = auth.uid())
  );

-- ------------------------------------------------------------
--  4) لا كود وسيط قبل الاعتماد
--
--  كان handle_new_user يُصدر broker_code لحظة التسجيل، فيصبح لدى
--  الغريب رابط عميل يعمل باسم منشأتك قبل أن يراه أحد.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email, full_name, phone)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name',''),
          coalesce(new.raw_user_meta_data->>'phone',''))
  on conflict (id) do nothing;
  -- كود الوسيط يُصدر عند الاعتماد، لا عند التسجيل.
  return new;
end $$;

-- سحب الأكواد التي صدرت لحسابات غير معتمدة (يشمل الدخيل).
delete from public.broker_codes bc
  using public.profiles p
  where p.id = bc.user_id and p.status <> 'active';

-- ------------------------------------------------------------
--  5) اعتماد ورفض — للأدمن فقط
-- ------------------------------------------------------------
create or replace function public.approve_user(p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.profiles
     set status = 'active',
         approved_by = auth.uid(),
         approved_at = now(),
         rejected_reason = null,
         org_id = coalesce(org_id, (select org_id from public.profiles where id = auth.uid()))
   where id = p_user;

  if not found then return 'not_found'; end if;

  insert into public.broker_codes(user_id, code)
  values (p_user, public.gen_broker_code())
  on conflict (user_id) do nothing;

  return 'ok';
end $$;
grant execute on function public.approve_user(uuid) to authenticated;

create or replace function public.reject_user(p_user uuid, p_reason text default null)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_user = auth.uid() then return 'self'; end if;

  update public.profiles
     set status = 'rejected', rejected_reason = p_reason,
         approved_by = auth.uid(), approved_at = now()
   where id = p_user;

  if not found then return 'not_found'; end if;

  delete from public.broker_codes where user_id = p_user;
  return 'ok';
end $$;
grant execute on function public.reject_user(uuid, text) to authenticated;

-- ------------------------------------------------------------
--  6) الدعوة من الأدمن = اعتماد
--
--  من يملك كود دعوة أصدرته أنت، فقد اعتمدتَه فعلًا.
-- ------------------------------------------------------------
create or replace function public.redeem_invite(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare inv public.invite_codes;
begin
  select * into inv from public.invite_codes
    where code = upper(trim(p_code)) and active and used_by is null
    for update;
  if inv.id is null then return 'invalid'; end if;

  update public.profiles
     set role = inv.role, org_id = inv.org_id,
         status = 'active', approved_at = now()
   where id = auth.uid();

  insert into public.broker_codes(user_id, code)
  values (auth.uid(), public.gen_broker_code())
  on conflict (user_id) do nothing;

  update public.invite_codes
    set used_by = auth.uid(), used_at = now(), active = false
    where id = inv.id;
  return 'ok';
end $$;
grant execute on function public.redeem_invite(text) to authenticated;

-- ============================================================
--  استعلام المراجعة — نفّذه الآن لتعرف من دخل
-- ============================================================
--  select id, email, full_name, phone, role, status, created_at
--    from public.profiles
--   order by created_at desc;
--
--  الحسابات المنتظرة فقط:
--  select id, email, full_name, phone, created_at
--    from public.profiles where status = 'pending'
--   order by created_at desc;
--
--  لرفض حساب الدخيل نهائيًا (يبقى السجل للمراجعة):
--  select public.reject_user('<uuid>', 'تسجيل ذاتي غير مصرّح');
--
--  ولحذفه من المصادقة تمامًا — من لوحة Supabase:
--  Authentication ← Users ← احذف المستخدم (الحذف يتسلسل إلى profiles).
-- ============================================================
