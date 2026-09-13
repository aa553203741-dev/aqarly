-- ============================================================
--  عقارلي — المرحلة 22: إغلاق تصعيد الصلاحيات على profiles
--
--  خطأ في 20_account_approval.sql:
--  أضفتُ سياسة profiles_self_update تمنع المستخدم من تغيير
--  status/role/org_id بنفسه — لكن schema.sql:202 فيه أصلًا:
--
--      create policy profiles_update_own on public.profiles
--        for update to authenticated
--        using (id = auth.uid() or public.is_admin())
--        with check (id = auth.uid() or public.is_admin());
--
--  وسياسات RLS الاعتيادية permissive: تُجمع بـ OR لا بـ AND.
--  فبقي المسار القديم مفتوحًا، وكان الحساب المعلّق يعتمد نفسه بـ:
--      update profiles set status='active', role='admin' where id = auth.uid();
--  ونفس الثغرة كانت ترقّي plan إلى premium بلا دفع.
--
--  الحل: صلاحيات على مستوى الأعمدة. هذه تُفحص بمعزل عن RLS،
--  ولا تتأثر بجمع السياسات، وتتجاوزها دوال SECURITY DEFINER
--  (approve_user / redeem_invite / activate_premium) لأنها تعمل
--  بصلاحية مالك الدالة لا المستخدم.
--
--  نفّذه بعد 20_account_approval.sql. آمن ومتكرر.
-- ============================================================

-- ------------------------------------------------------------
--  1) السياسة المكررة — لا قيمة لها، وإبقاؤها يوهم بحماية
-- ------------------------------------------------------------
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_self_read   on public.profiles;  -- نسخة من profiles_select_own

-- ------------------------------------------------------------
--  2) الحدّ الحقيقي: المستخدم يعدّل بياناته الشخصية فقط
--
--  بعد هذا السطر لا يستطيع أي عميل متصل بدور authenticated أن
--  يكتب في status أو role أو org_id أو plan — ولو مرّر السياسة.
-- ------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant  update (full_name, phone) on public.profiles to authenticated;

-- ------------------------------------------------------------
--  3) إجراءات الأدمن تمرّ بدوال مفحوصة بدل الكتابة المباشرة
--
--  كان TeamManager يكتب role مباشرة وAdminBrokers يكتب plan.
--  بعد سحب صلاحية العمود لم يعد ذلك ممكنًا، فهذه بدائلها.
-- ------------------------------------------------------------
create or replace function public.set_user_role(p_user uuid, p_role text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    return 'self';   -- لا تنزع دورك بنفسك فتُقفل على نفسك الباب
  end if;

  update public.profiles set role = p_role where id = p_user;
  if not found then return 'not_found'; end if;
  return 'ok';
end $$;
grant execute on function public.set_user_role(uuid, text) to authenticated;

create or replace function public.set_user_plan(
  p_user uuid, p_plan text, p_days int default 0
)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_plan not in ('free','premium') then return 'bad_plan'; end if;

  update public.profiles
     set plan = p_plan,
         plan_expires_at = case
           when p_plan = 'premium' and p_days > 0
             then now() + make_interval(days => p_days)
           when p_plan = 'free' then null
           else plan_expires_at end
   where id = p_user;

  if not found then return 'not_found'; end if;
  return 'ok';
end $$;
grant execute on function public.set_user_plan(uuid, text, int) to authenticated;

-- ============================================================
--  تحقّق — نفّذه بحساب مسوّق عادي (لا أدمن) وتوقّع الفشل
-- ============================================================
--  update public.profiles set status = 'active' where id = auth.uid();
--    => ERROR: permission denied for table profiles
--
--  update public.profiles set full_name = 'اسم جديد' where id = auth.uid();
--    => نجاح (هذا هو المسموح)
--
--  وبحساب أدمن:
--  select public.set_user_role('<uuid>', 'marketer');   => ok
-- ============================================================
