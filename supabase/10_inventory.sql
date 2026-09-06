-- ============================================================
--  عقارلي — المرحلة 2: مخزون المشاريع + الحجوزات + الأدوار
--  Postgres + Supabase. نفّذه بعد schema.sql. التنفيذ المتكرر آمن.
--
--  يبني: المنشأة (org) · الأدوار الأربعة · الصلاحيات الدقيقة ·
--  الجغرافيا · المطوّرون · المشاريع · النماذج · الوحدات ·
--  الحجوزات ودورة الصفقة · دفعات الصفقة · السجل ·
--  فهارس + views للبحث والتجميع + دوال حجز ذرّية + RLS.
-- ============================================================

-- ============================================================
--  0) المنشأة (org) — واحدة الآن، والعمود يهيّئ لتعدد الشركات لاحقًا
-- ============================================================
create table if not exists public.orgs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'عقارلي',
  created_at timestamptz not null default now()
);
insert into public.orgs (name)
  select 'عقارلي' where not exists (select 1 from public.orgs);

-- ============================================================
--  1) توسعة profiles: org_id + الأدوار الأربعة
-- ============================================================
alter table public.profiles add column if not exists org_id uuid references public.orgs(id);
update public.profiles set org_id = (select id from public.orgs order by created_at limit 1)
  where org_id is null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','marketer','staff','viewer','broker'));

-- ============================================================
--  2) الصلاحيات الدقيقة (فوق الدور)
-- ============================================================
create table if not exists public.user_permissions (
  user_id                  uuid primary key references public.profiles(id) on delete cascade,
  can_reserve              boolean not null default true,
  can_process_payments     boolean not null default false,
  can_close_deals          boolean not null default false,
  can_manage_inventory     boolean not null default false,
  can_view_all_commissions boolean not null default false
);

-- صف صلاحيات لكل مستخدم حالي (المسوّق: يحجز افتراضيًا)
insert into public.user_permissions (user_id)
  select id from public.profiles
  on conflict (user_id) do nothing;

-- الأدمن يملك كل الصلاحيات
update public.user_permissions up set
  can_process_payments = true, can_close_deals = true,
  can_manage_inventory = true, can_view_all_commissions = true
  from public.profiles p
  where p.id = up.user_id and p.role = 'admin';

-- صف صلاحيات تلقائي لكل مستخدم جديد
create or replace function public.seed_user_permissions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_permissions (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists trg_seed_perms on public.profiles;
create trigger trg_seed_perms after insert on public.profiles
  for each row execute function public.seed_user_permissions();

-- ============================================================
--  3) دوال مساعدة
-- ============================================================
create or replace function public.current_org()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid();
$$;

create or replace function public.has_perm(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
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

-- ============================================================
--  4) الجغرافيا (مدينة ← منطقة ← حي)
-- ============================================================
create table if not exists public.districts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  city        text not null,
  zone        text default '',          -- المنطقة (مثال: شمال جدة)
  name        text not null,            -- الحي (مثال: النزهة)
  center_lat  double precision,
  center_lng  double precision,
  created_at  timestamptz not null default now(),
  unique (org_id, city, zone, name)
);

-- ============================================================
--  5) المطوّرون
-- ============================================================
create table if not exists public.developers (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  name              text not null,
  logo_url          text,
  phone             text,
  sales_rep_name    text,
  sales_rep_phone   text,
  website           text,
  notes             text default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references public.profiles(id)
);

-- ============================================================
--  6) المشاريع
-- ============================================================
create table if not exists public.projects (
  id                        uuid primary key default gen_random_uuid(),
  org_id                    uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  developer_id              uuid references public.developers(id) on delete set null,
  district_id               uuid references public.districts(id) on delete set null,
  name                      text not null,
  description               text default '',
  status                    text not null default 'off_plan'
                            check (status in ('ready','under_construction','off_plan')),
  cover_image               text,
  images                    text[] default '{}',
  lat                       double precision,
  lng                       double precision,
  maps_url                  text,
  default_commission_amount numeric,     -- عمولة افتراضية تُطبَّق على وحدات المشروع
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  created_by                uuid references public.profiles(id)
);
create index if not exists idx_projects_district on public.projects(district_id);
create index if not exists idx_projects_developer on public.projects(developer_id);
create index if not exists idx_projects_org on public.projects(org_id);

-- ============================================================
--  7) نماذج الشقق (المواصفات تُدخل مرة واحدة)
-- ============================================================
create table if not exists public.unit_models (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  project_id     uuid not null references public.projects(id) on delete cascade,
  name           text not null,          -- A / B / C
  bedrooms       int,
  area           numeric,
  bathrooms      int,
  majlis         boolean default false,
  hall           boolean default false,
  kitchen        boolean default true,
  maid_room      boolean default false,
  balcony        boolean default false,
  floor_plan_url text,
  extra_features jsonb default '{}',
  notes          text default '',
  created_at     timestamptz not null default now()
);
create index if not exists idx_models_project on public.unit_models(project_id);

-- ============================================================
--  8) الوحدات الفعلية (الفروقات فقط + عمولة)
-- ============================================================
create table if not exists public.units (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  project_id        uuid not null references public.projects(id) on delete cascade,
  model_id          uuid references public.unit_models(id) on delete set null,
  unit_no           text not null,
  floor             int,
  building_no       text,
  price             numeric,
  discount_price    numeric,
  status            text not null default 'available'
                    check (status in ('available','reserved','sold','unavailable')),
  view              text,                 -- الإطلالة
  direction         text,                 -- الاتجاه
  parking_no        text,
  storage_no        text,
  commission_amount numeric,              -- عمولة المسوّق (مبلغ يُدخَل)
  notes             text default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_units_project_status on public.units(project_id, status);
create index if not exists idx_units_model on public.units(model_id);
create index if not exists idx_units_status on public.units(status);

-- ============================================================
--  9) الحجوزات ودورة الصفقة (مدة يدوية — بلا انتهاء تلقائي)
-- ============================================================
create table if not exists public.reservations (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  unit_id           uuid not null references public.units(id) on delete cascade,
  project_id        uuid not null references public.projects(id) on delete cascade,
  marketer_id       uuid not null references public.profiles(id),   -- صاحب العمولة (مقفل)
  client_lead_id    uuid references public.client_leads(id) on delete set null,
  client_name       text,
  client_phone      text,
  assigned_staff_id uuid references public.profiles(id),
  stage             text not null default 'reserved'
                    check (stage in ('reserved','documents','down_payment','paying','paid','closed','cancelled')),
  agreed_price      numeric,
  discount          numeric,
  commission_amount numeric,              -- لقطة مقفلة للمسوّق
  commission_status text not null default 'pending'
                    check (commission_status in ('pending','earned','paid')),
  reserved_at       timestamptz not null default now(),
  closed_at         timestamptz,
  cancelled_reason  text,
  notes             text default '',
  created_at        timestamptz not null default now()
);
create index if not exists idx_res_marketer on public.reservations(marketer_id, created_at desc);
create index if not exists idx_res_stage on public.reservations(stage);
create index if not exists idx_res_unit on public.reservations(unit_id);
-- حجز نشط واحد فقط لكل وحدة (لا يُحسب الملغى)
create unique index if not exists uq_res_active_unit
  on public.reservations(unit_id) where stage <> 'cancelled';

-- ============================================================
--  10) دفعات الصفقة + السجل
-- ============================================================
create table if not exists public.deal_payments (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  type           text not null default 'installment'
                 check (type in ('down','installment','other')),
  amount         numeric not null,
  paid_at        timestamptz,
  method         text,
  receipt_url    text,
  notes          text default '',
  created_at     timestamptz not null default now()
);
create index if not exists idx_dpay_res on public.deal_payments(reservation_id);

create table if not exists public.reservation_history (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  from_stage     text,
  to_stage       text,
  changed_by     uuid references public.profiles(id),
  note           text default '',
  created_at     timestamptz not null default now()
);
create index if not exists idx_rhist_res on public.reservation_history(reservation_id, created_at);

-- ============================================================
--  11) مشغّلات updated_at + بصمة تحديث المشروع
-- ============================================================
drop trigger if exists trg_dev_touch on public.developers;
create trigger trg_dev_touch before update on public.developers
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_proj_touch on public.projects;
create trigger trg_proj_touch before update on public.projects
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_unit_touch on public.units;
create trigger trg_unit_touch before update on public.units
  for each row execute function public.touch_updated_at();

-- أي تغيير وحدة يرفع بصمة «آخر تحديث» للمشروع
create or replace function public.bump_project_updated()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.projects set updated_at = now()
    where id = coalesce(new.project_id, old.project_id);
  return coalesce(new, old);
end $$;
drop trigger if exists trg_unit_bump_project on public.units;
create trigger trg_unit_bump_project after insert or update or delete on public.units
  for each row execute function public.bump_project_updated();

-- ============================================================
--  12) الدوال الذرّية للحجز ودورة الصفقة
-- ============================================================
-- حجز وحدة ذرّيًا (يمنع التعارض): يتحقّق أنها متاحة ويحجزها في خطوة واحدة
create or replace function public.reserve_unit(
  p_unit_id        uuid,
  p_client_lead_id uuid default null,
  p_client_name    text default null,
  p_client_phone   text default null,
  p_agreed_price   numeric default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare u public.units; res_id uuid;
begin
  if not public.has_perm('can_reserve') then
    raise exception 'غير مصرّح بالحجز';
  end if;

  select * into u from public.units where id = p_unit_id for update;   -- قفل الصف
  if u.id is null then raise exception 'الوحدة غير موجودة'; end if;
  if u.status <> 'available' then raise exception 'الوحدة غير متاحة'; end if;

  insert into public.reservations(
    org_id, unit_id, project_id, marketer_id, client_lead_id,
    client_name, client_phone, agreed_price, commission_amount, stage
  ) values (
    u.org_id, u.id, u.project_id, auth.uid(), p_client_lead_id,
    p_client_name, p_client_phone,
    coalesce(p_agreed_price, u.discount_price, u.price),
    coalesce(u.commission_amount,
             (select default_commission_amount from public.projects where id = u.project_id)),
    'reserved'
  ) returning id into res_id;

  update public.units set status = 'reserved' where id = u.id;

  insert into public.reservation_history(reservation_id, from_stage, to_stage, changed_by, note)
    values (res_id, null, 'reserved', auth.uid(), 'إنشاء الحجز');

  return res_id;
end $$;
grant execute on function public.reserve_unit(uuid, uuid, text, text, numeric) to authenticated;

-- تقديم مرحلة الصفقة (بصلاحيات الموظف) + مزامنة حالة الوحدة والعمولة
create or replace function public.advance_reservation(p_res_id uuid, p_new_stage text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.reservations;
begin
  select * into r from public.reservations where id = p_res_id for update;
  if r.id is null then raise exception 'الحجز غير موجود'; end if;

  -- الصلاحيات: الإقفال يحتاج can_close_deals، وبقية مراحل الدفع can_process_payments
  if p_new_stage = 'closed' and not public.has_perm('can_close_deals') then
    raise exception 'غير مصرّح بإقفال الصفقة';
  elsif p_new_stage in ('documents','down_payment','paying','paid')
        and not public.has_perm('can_process_payments') then
    raise exception 'غير مصرّح بمتابعة الدفع';
  elsif p_new_stage = 'cancelled'
        and not (public.has_perm('can_process_payments') or r.marketer_id = auth.uid()) then
    raise exception 'غير مصرّح بالإلغاء';
  end if;

  update public.reservations set
    stage = p_new_stage,
    closed_at = case when p_new_stage = 'closed' then now() else closed_at end,
    commission_status = case when p_new_stage = 'closed' then 'earned' else commission_status end
    where id = p_res_id;

  -- مزامنة حالة الوحدة
  if p_new_stage = 'closed' then
    update public.units set status = 'sold' where id = r.unit_id;
  elsif p_new_stage = 'cancelled' then
    update public.units set status = 'available' where id = r.unit_id;
  end if;

  insert into public.reservation_history(reservation_id, from_stage, to_stage, changed_by)
    values (p_res_id, r.stage, p_new_stage, auth.uid());
end $$;
grant execute on function public.advance_reservation(uuid, text) to authenticated;

-- اعتماد صرف العمولة (مالية/أدمن)
create or replace function public.mark_commission_paid(p_res_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.has_perm('can_view_all_commissions')) then
    raise exception 'غير مصرّح';
  end if;
  update public.reservations set commission_status = 'paid'
    where id = p_res_id and commission_status = 'earned';
end $$;
grant execute on function public.mark_commission_paid(uuid) to authenticated;

-- ============================================================
--  13) Views: البحث السريع + تجميع الشاشة الرئيسية
--  (security_invoker=true ⇒ تطبّق RLS المستخدم على الجداول الأصلية)
-- ============================================================
drop view if exists public.units_search;
create view public.units_search with (security_invoker = true) as
select
  u.id, u.org_id, u.unit_no, u.floor, u.building_no, u.price, u.discount_price,
  u.status, u.view, u.direction, u.commission_amount,
  m.bedrooms, m.area, m.bathrooms, m.name as model_name, m.floor_plan_url,
  p.id as project_id, p.name as project_name, p.status as project_status,
  p.lat, p.lng, p.cover_image,
  d.id as developer_id, d.name as developer_name,
  g.id as district_id, g.city, g.zone, g.name as district_name
from public.units u
  left join public.unit_models m on m.id = u.model_id
  join public.projects p on p.id = u.project_id
  left join public.developers d on d.id = p.developer_id
  left join public.districts g on g.id = p.district_id;

drop view if exists public.district_stats;
create view public.district_stats with (security_invoker = true) as
select
  g.id as district_id, g.city, g.zone, g.name as district_name, g.org_id,
  count(distinct p.id) as projects_count,
  count(u.id) filter (where u.status = 'available') as available_units
from public.districts g
  left join public.projects p on p.district_id = g.id
  left join public.units u on u.project_id = p.id
group by g.id, g.city, g.zone, g.name, g.org_id;

-- ============================================================
--  14) RLS — تفعيل + سياسات
-- ============================================================
alter table public.orgs               enable row level security;
alter table public.user_permissions   enable row level security;
alter table public.districts          enable row level security;
alter table public.developers         enable row level security;
alter table public.projects           enable row level security;
alter table public.unit_models        enable row level security;
alter table public.units              enable row level security;
alter table public.reservations       enable row level security;
alter table public.deal_payments      enable row level security;
alter table public.reservation_history enable row level security;

revoke select on public.orgs, public.user_permissions from anon;

-- orgs: يقرأ أعضاء المنشأة
drop policy if exists orgs_select on public.orgs;
create policy orgs_select on public.orgs for select to authenticated
  using (id = public.current_org());

-- user_permissions: المستخدم يقرأ صفّه، والأدمن يدير الكل
drop policy if exists perms_select on public.user_permissions;
create policy perms_select on public.user_permissions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists perms_admin_write on public.user_permissions;
create policy perms_admin_write on public.user_permissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- المخزون (districts/developers/projects/unit_models/units):
--   قراءة لكل أعضاء المنشأة · كتابة للأدمن أو can_manage_inventory
do $$
declare t text;
begin
  foreach t in array array['districts','developers','projects','unit_models','units'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format(
      'create policy %I_read on public.%I for select to authenticated using (org_id = public.current_org())', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format(
      'create policy %I_write on public.%I for all to authenticated using (org_id = public.current_org() and public.has_perm(''can_manage_inventory'')) with check (org_id = public.current_org() and public.has_perm(''can_manage_inventory''))', t, t);
  end loop;
end $$;

-- reservations: المسوّق يرى حجوزاته · الموظف/الأدمن يرى الكل
drop policy if exists res_select on public.reservations;
create policy res_select on public.reservations for select to authenticated
  using (
    org_id = public.current_org() and (
      marketer_id = auth.uid()
      or public.is_admin()
      or public.has_perm('can_process_payments')
      or public.has_perm('can_view_all_commissions')
    )
  );
-- الإنشاء والتعديل يتمّان عبر الدوال الذرّية (SECURITY DEFINER)؛ نمنع الكتابة المباشرة.

-- deal_payments: قراءة/كتابة للموظف (دفع) والأدمن
drop policy if exists dpay_read on public.deal_payments;
create policy dpay_read on public.deal_payments for select to authenticated
  using (org_id = public.current_org() and (public.is_admin() or public.has_perm('can_process_payments')));
drop policy if exists dpay_write on public.deal_payments;
create policy dpay_write on public.deal_payments for all to authenticated
  using (org_id = public.current_org() and public.has_perm('can_process_payments'))
  with check (org_id = public.current_org() and public.has_perm('can_process_payments'));

-- reservation_history: قراءة لمن يرى الحجز
drop policy if exists rhist_read on public.reservation_history;
create policy rhist_read on public.reservation_history for select to authenticated
  using (exists (select 1 from public.reservations r where r.id = reservation_id));

-- ============================================================
--  تحقّق بعد التنفيذ:
--    select role, org_id from public.profiles where id = auth.uid();
--    select * from public.district_stats;   -- فارغ حتى تُدخل بيانات
-- ============================================================
