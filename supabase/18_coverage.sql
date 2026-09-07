-- ============================================================
--  عقارلي — الميزة: التغطية الجغرافية لكل مسوّق
--  الأدمن يخصّص أحياءً لمسوّق؛ فيرى المسوّق تغطيته فقط.
--  (تصفية على مستوى الواجهة — المخزون يبقى مشتركًا).
--  نفّذه بعد 10_inventory.sql.
-- ============================================================

create table if not exists public.marketer_coverage (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  marketer_id uuid not null references public.profiles(id) on delete cascade,
  district_id uuid not null references public.districts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (marketer_id, district_id)
);
create index if not exists idx_cov_marketer on public.marketer_coverage(marketer_id);

alter table public.marketer_coverage enable row level security;
revoke select on public.marketer_coverage from anon;

-- الأدمن يدير التغطية
drop policy if exists cov_admin on public.marketer_coverage;
create policy cov_admin on public.marketer_coverage
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- المسوّق يقرأ تغطيته
drop policy if exists cov_own_read on public.marketer_coverage;
create policy cov_own_read on public.marketer_coverage
  for select to authenticated
  using (marketer_id = auth.uid() or public.is_admin());
