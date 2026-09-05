-- ============================================================
--  عقارلي — إعداد كامل (schema + subscriptions + payments)
--  الصق هذا الملف كاملًا في Supabase > SQL Editor ونفّذه مرة واحدة.
--  (تريغر إشعار واتساب في 04_notifications.sql منفصل لأنه يحتاج نطاقك)
-- ============================================================

-- ############ 1) schema.sql ############
-- ============================================================
--  عقارلي (Aqarly) — مخطّط قاعدة البيانات الكامل
--  Postgres + Supabase — آمن من اليوم الأول
--
--  المبدأ الأمني: كل جدول محمي بـ RLS. لا قراءة علنية لأي جدول
--  يحوي بيانات شخصية. البحث العام عن الوسيط بالكود يتم عبر دالة
--  SECURITY DEFINER تُرجع صفًا واحدًا فقط — لا تعداد للجدول.
--
--  التنفيذ: Supabase Dashboard > SQL Editor > الصق ونفّذ.
--  التنفيذ متكرر آمن (idempotent) قدر الإمكان.
-- ============================================================

-- ---------- الامتدادات ----------
create extension if not exists pgcrypto;

-- ============================================================
--  1) الملفات الشخصية (الوسطاء) — مرتبطة بـ auth.users
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  full_name     text,
  phone         text,
  role          text not null default 'broker' check (role in ('broker','admin')),
  plan          text not null default 'free'   check (plan in ('free','premium')),
  plan_expires_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
--  2) أكواد الوسطاء — كود قابل للمشاركة يفتح نموذج العميل
-- ============================================================
create table if not exists public.broker_codes (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  code        text not null unique,
  created_at  timestamptz not null default now()
);

-- ============================================================
--  3) طلبات العملاء (Leads) — يدخلها العميل عبر النموذج العام
-- ============================================================
create table if not exists public.client_leads (
  id                  uuid primary key default gen_random_uuid(),
  broker_user_id      uuid not null references public.profiles(id) on delete cascade,
  client_name         text not null,
  phone               text not null,
  deal_type           text not null check (deal_type in ('buy','rent')),
  property_type       text not null,
  property_type_other text default '',
  city                text not null,
  district            text default '',
  budget              numeric,
  notes               text default '',
  status              text not null default 'new' check (status in ('new','in_progress','done','rejected')),
  created_at          timestamptz not null default now()
);
create index if not exists idx_leads_broker on public.client_leads(broker_user_id, created_at desc);

-- ============================================================
--  4) عروض الوسيط (Listings) — عقارات معروضة لدى الوسيط
-- ============================================================
create table if not exists public.listings (
  id              uuid primary key default gen_random_uuid(),
  broker_user_id  uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  deal_type       text not null check (deal_type in ('buy','rent')),
  property_type   text not null,
  city            text not null,
  district        text default '',
  price           numeric,
  area            numeric,
  bedrooms        int,
  notes           text default '',
  status          text not null default 'active' check (status in ('active','closed')),
  created_at      timestamptz not null default now()
);
create index if not exists idx_listings_broker on public.listings(broker_user_id, created_at desc);

-- ============================================================
--  5) الدعوات والمكافآت
-- ============================================================
create table if not exists public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_user_id  uuid not null references public.profiles(id) on delete cascade,
  referred_user_id  uuid not null references public.profiles(id) on delete cascade,
  referred_email    text,
  referrer_code     text,
  status            text not null default 'pending' check (status in ('pending','earned','rewarded')),
  created_at        timestamptz not null default now(),
  earned_at         timestamptz,
  unique (referred_user_id)
);

-- ============================================================
--  6) إعدادات التطبيق (مفتاح/قيمة) — يكتبها الأدمن فقط
-- ============================================================
create table if not exists public.app_settings (
  key         text primary key,
  value       text,
  is_public   boolean not null default false,  -- true = يقرؤه الزائر (سعر، اسم منشأة…)
  updated_at  timestamptz not null default now()
);

-- بذور إعدادات افتراضية
insert into public.app_settings(key, value, is_public) values
  ('pricing_enabled','false', true),
  ('premium_monthly_price','29', true),
  ('premium_yearly_price','290', true),
  ('company_name','عقارلي', true)
on conflict (key) do nothing;

-- ============================================================
--  دوال مساعدة
-- ============================================================

-- هل المستخدم الحالي أدمن؟ (تُستخدم داخل سياسات RLS)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- بحث آمن عن وسيط بكوده — يُرجع صفًا واحدًا فقط، بلا تعداد للجدول.
-- هذا بديل كشف جدول broker_codes للزائر (الثغرة التي تجنّبناها).
create or replace function public.lookup_broker_by_code(p_code text)
returns table(user_id uuid, broker_name text)
language sql stable security definer set search_path = public as $$
  select bc.user_id, coalesce(p.full_name,'')
  from public.broker_codes bc
  join public.profiles p on p.id = bc.user_id
  where bc.code = upper(trim(p_code))
  limit 1;
$$;
grant execute on function public.lookup_broker_by_code(text) to anon, authenticated;

-- توليد كود فريد من 6 خانات
create or replace function public.gen_broker_code()
returns text language plpgsql as $$
declare c text; ok boolean;
begin
  loop
    c := upper(substr(encode(gen_random_bytes(6),'hex'),1,6));
    select not exists(select 1 from public.broker_codes where code = c) into ok;
    exit when ok;
  end loop;
  return c;
end $$;

-- عند إنشاء مستخدم جديد: أنشئ ملفه الشخصي + كود وسيط تلقائيًا
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email, full_name, phone)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name',''),
          coalesce(new.raw_user_meta_data->>'phone',''))
  on conflict (id) do nothing;

  insert into public.broker_codes(user_id, code)
  values (new.id, public.gen_broker_code())
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- تحديث updated_at تلقائيًا
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================
--  تفعيل RLS على كل الجداول
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.broker_codes  enable row level security;
alter table public.client_leads  enable row level security;
alter table public.listings      enable row level security;
alter table public.referrals     enable row level security;
alter table public.app_settings  enable row level security;

-- منع أي وصول افتراضي للزائر إلى الجداول الحسّاسة صراحةً
revoke select on public.profiles, public.broker_codes, public.referrals from anon;

-- ---------- سياسات: profiles ----------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ملاحظة: الإدراج يتم عبر التريغر (security definer)، فلا حاجة لسياسة insert عامة.

-- ---------- سياسات: broker_codes ----------
-- لا SELECT للزائر إطلاقًا. الوسيط يقرأ كوده فقط. البحث العام عبر RPC.
drop policy if exists broker_codes_select_own on public.broker_codes;
create policy broker_codes_select_own on public.broker_codes
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------- سياسات: client_leads ----------
-- الزائر يُدرِج طلبًا فقط، وبشرط أن يكون الوسيط المستهدف موجودًا فعلًا.
-- ولا يستطيع الزائر قراءة أي طلب.
drop policy if exists leads_insert_public on public.client_leads;
create policy leads_insert_public on public.client_leads
  for insert to anon, authenticated
  with check (
    status = 'new'
    and exists (select 1 from public.profiles p where p.id = broker_user_id)
  );

drop policy if exists leads_select_owner on public.client_leads;
create policy leads_select_owner on public.client_leads
  for select to authenticated
  using (broker_user_id = auth.uid() or public.is_admin());

drop policy if exists leads_update_owner on public.client_leads;
create policy leads_update_owner on public.client_leads
  for update to authenticated
  using (broker_user_id = auth.uid() or public.is_admin())
  with check (broker_user_id = auth.uid() or public.is_admin());

drop policy if exists leads_delete_owner on public.client_leads;
create policy leads_delete_owner on public.client_leads
  for delete to authenticated
  using (broker_user_id = auth.uid() or public.is_admin());

-- ---------- سياسات: listings ----------
drop policy if exists listings_all_owner on public.listings;
create policy listings_all_owner on public.listings
  for all to authenticated
  using (broker_user_id = auth.uid() or public.is_admin())
  with check (broker_user_id = auth.uid() or public.is_admin());

-- ---------- سياسات: referrals ----------
drop policy if exists referrals_select_own on public.referrals;
create policy referrals_select_own on public.referrals
  for select to authenticated
  using (referrer_user_id = auth.uid() or public.is_admin());

-- ---------- سياسات: app_settings ----------
-- الزائر والمسجّل يقرؤون المفاتيح العامة فقط. الكتابة للأدمن فقط.
drop policy if exists settings_select_public on public.app_settings;
create policy settings_select_public on public.app_settings
  for select to anon, authenticated
  using (is_public = true or public.is_admin());

drop policy if exists settings_write_admin on public.app_settings;
create policy settings_write_admin on public.app_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
--  تعيين أول أدمن (بدّل البريد ثم نفّذ هذا السطر يدويًا):
--    update public.profiles set role='admin' where email='YOU@example.com';
-- ============================================================

-- ############ 2) 02_subscriptions.sql ############
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

-- ############ 3) 03_payments.sql ############
-- ============================================================
--  عقارلي — ترقية: المدفوعات (Moyasar)
--  نفّذه بعد 02_subscriptions.sql. التنفيذ المتكرر آمن.
--
--  ملاحظة أمنية: الكتابة على هذا الجدول تتم حصريًا من الخادم
--  عبر مفتاح service_role (يتجاوز RLS). لا سياسات إدراج/تحديث
--  للزائر أو المستخدم — القراءة فقط لصاحب الصف أو الأدمن.
-- ============================================================

create table if not exists public.payments (
  id          text primary key,               -- معرّف الدفعة/الفاتورة لدى Moyasar
  user_id     uuid references public.profiles(id) on delete set null,
  amount      integer not null,               -- بالهللات (SAR × 100)
  currency    text not null default 'SAR',
  billing     text check (billing in ('monthly','yearly')),
  status      text not null default 'initiated'
              check (status in ('initiated','paid','failed')),
  provider    text not null default 'moyasar',
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);
create index if not exists idx_payments_user on public.payments(user_id, created_at desc);

alter table public.payments enable row level security;
revoke select on public.payments from anon;

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- دالة تفعيل مميّز (تُستدعى من الخادم بعد تأكيد الدفع). SECURITY DEFINER.
create or replace function public.activate_premium(p_user_id uuid, p_days int default 0)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set plan = 'premium',
         plan_expires_at = case when p_days > 0
           then now() + make_interval(days => p_days) else null end
   where id = p_user_id;

  update public.upgrade_requests
     set status = 'approved', decided_at = now()
   where user_id = p_user_id and status = 'pending';
end $$;

