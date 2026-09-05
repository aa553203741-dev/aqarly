-- ============================================================
--  عقارلي — ترقية: نظام الاشتراكات (طلبات الترقية)
--  نفّذه بعد schema.sql. التنفيذ المتكرر آمن.
-- ============================================================

create table if not exists public.upgrade_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  plan        text not null default 'premium' check (plan in ('premium')),
  billing     text not null default 'monthly' check (billing in ('monthly','yearly')),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  note        text default '',
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);
create index if not exists idx_upgrade_user on public.upgrade_requests(user_id, created_at desc);
create index if not exists idx_upgrade_status on public.upgrade_requests(status);

alter table public.upgrade_requests enable row level security;
revoke select on public.upgrade_requests from anon;

-- الوسيط: يُنشئ طلبًا لنفسه ويقرأ طلباته فقط
drop policy if exists upgrade_insert_own on public.upgrade_requests;
create policy upgrade_insert_own on public.upgrade_requests
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists upgrade_select_own on public.upgrade_requests;
create policy upgrade_select_own on public.upgrade_requests
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- الأدمن فقط: يوافق/يرفض
drop policy if exists upgrade_update_admin on public.upgrade_requests;
create policy upgrade_update_admin on public.upgrade_requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists upgrade_delete_admin on public.upgrade_requests;
create policy upgrade_delete_admin on public.upgrade_requests
  for delete to authenticated
  using (public.is_admin());

-- دالة موافقة ذرّية: تعتمد الطلب وترقّي خطة الوسيط في خطوة واحدة (للأدمن فقط)
create or replace function public.approve_upgrade(p_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.upgrade_requests;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  update public.upgrade_requests
     set status = 'approved', decided_at = now()
   where id = p_request_id and status = 'pending'
  returning * into r;

  if r.id is null then
    return; -- الطلب غير موجود أو سبق البتّ فيه
  end if;

  update public.profiles
     set plan = 'premium'
   where id = r.user_id;
end $$;
grant execute on function public.approve_upgrade(uuid) to authenticated;
