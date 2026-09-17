-- ============================================================
--  عقارلي — الميزة: حجز زيارة للعقار من بطاقة المشاركة
--
--  العميل (زائر) يطلب زيارة وحدة من الرابط المُشارَك، فيصل الطلب
--  للمسوّق صاحب الكود (إن وُجد في الرابط) أو للأدمن والموظفين.
--
--  نفّذه بعد 17_notifications.sql. آمن ومتكرر.
-- ============================================================

create table if not exists public.visit_bookings (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  unit_id      uuid references public.units(id) on delete set null,
  project_id   uuid references public.projects(id) on delete set null,
  marketer_id  uuid references public.profiles(id) on delete set null,
  client_name  text not null,
  client_phone text not null,
  preferred_at text not null default '',     -- وقت مفضّل (نص حر)
  note         text not null default '',
  status       text not null default 'new'
               check (status in ('new','confirmed','done','cancelled')),
  created_at   timestamptz not null default now()
);
create index if not exists idx_visits_org on public.visit_bookings(org_id, created_at desc);
create index if not exists idx_visits_marketer on public.visit_bookings(marketer_id, created_at desc);

alter table public.visit_bookings enable row level security;
revoke all on public.visit_bookings from anon;

-- المسوّق يرى طلباته، والأدمن/الموظفون يرون كل طلبات المنشأة.
drop policy if exists visits_read on public.visit_bookings;
create policy visits_read on public.visit_bookings
  for select to authenticated
  using (
    org_id = public.current_org()
    and (
      marketer_id = auth.uid()
      or public.is_admin()
      or public.has_perm('can_process_payments')
      or public.has_perm('can_close_deals')
    )
  );

drop policy if exists visits_update on public.visit_bookings;
create policy visits_update on public.visit_bookings
  for update to authenticated
  using (
    org_id = public.current_org()
    and (
      marketer_id = auth.uid()
      or public.is_admin()
      or public.has_perm('can_process_payments')
      or public.has_perm('can_close_deals')
    )
  )
  with check (org_id = public.current_org());

-- ------------------------------------------------------------
--  إنشاء الحجز من الزائر — عبر دالة آمنة (لا وصول مباشر للجدول)
-- ------------------------------------------------------------
create or replace function public.book_visit(
  p_unit_id     uuid,
  p_name        text,
  p_phone       text,
  p_preferred   text default '',
  p_note        text default '',
  p_broker_code text default null
)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_org      uuid;
  v_project  uuid;
  v_marketer uuid;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = '' then
    return 'missing';
  end if;

  select u.org_id, u.project_id into v_org, v_project
    from public.units u where u.id = p_unit_id;
  if v_org is null then return 'invalid'; end if;

  if coalesce(trim(p_broker_code), '') <> '' then
    select user_id into v_marketer
      from public.broker_codes where code = upper(trim(p_broker_code));
  end if;

  insert into public.visit_bookings(
    org_id, unit_id, project_id, marketer_id,
    client_name, client_phone, preferred_at, note
  ) values (
    v_org, p_unit_id, v_project, v_marketer,
    trim(p_name), trim(p_phone), coalesce(p_preferred, ''), coalesce(p_note, '')
  );
  return 'ok';
end $$;
grant execute on function public.book_visit(uuid, text, text, text, text, text)
  to anon, authenticated;

-- ------------------------------------------------------------
--  إشعار عند طلب زيارة جديد
-- ------------------------------------------------------------
create or replace function public.notify_new_visit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.marketer_id is not null then
    insert into public.notifications(org_id, user_id, type, title, body, link)
    values (new.org_id, new.marketer_id, 'visit', 'طلب زيارة جديد',
            new.client_name || ' يطلب زيارة عقار', '/dashboard/visits');
  else
    insert into public.notifications(org_id, user_id, type, title, body, link)
    select new.org_id, p.id, 'visit', 'طلب زيارة جديد',
           new.client_name || ' يطلب زيارة عقار', '/dashboard/visits'
    from public.profiles p
      left join public.user_permissions up on up.user_id = p.id
    where p.org_id = new.org_id
      and (p.role = 'admin'
           or up.can_process_payments = true
           or up.can_close_deals = true);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_new_visit on public.visit_bookings;
create trigger trg_notify_new_visit after insert on public.visit_bookings
  for each row execute function public.notify_new_visit();
