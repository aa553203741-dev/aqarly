-- ============================================================
--  عقارلي — الميزة: CRM خفيف (عملاء المسوّق + الوحدات المعروضة)
--  نفّذه بعد 10_inventory.sql.
-- ============================================================

create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  marketer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name        text not null,
  phone       text,
  budget      numeric,
  notes       text default '',
  created_at  timestamptz not null default now()
);
create index if not exists idx_clients_marketer on public.clients(marketer_id, created_at desc);

create table if not exists public.client_units (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  unit_id     uuid not null references public.units(id) on delete cascade,
  status      text not null default 'shown'
              check (status in ('shown','interested','visited','negotiating','rejected')),
  notes       text default '',
  created_at  timestamptz not null default now(),
  unique (client_id, unit_id)
);
create index if not exists idx_cunits_client on public.client_units(client_id);

alter table public.clients      enable row level security;
alter table public.client_units enable row level security;
revoke select on public.clients, public.client_units from anon;

-- العميل: المسوّق يدير عملاءه، والأدمن يرى الجميع
drop policy if exists clients_own on public.clients;
create policy clients_own on public.clients
  for all to authenticated
  using (marketer_id = auth.uid() or public.is_admin())
  with check (marketer_id = auth.uid() or public.is_admin());

-- وحدات العميل: مرتبطة بملكية العميل
drop policy if exists cunits_own on public.client_units;
create policy cunits_own on public.client_units
  for all to authenticated
  using (
    exists (select 1 from public.clients c
            where c.id = client_id and (c.marketer_id = auth.uid() or public.is_admin()))
  )
  with check (
    exists (select 1 from public.clients c
            where c.id = client_id and (c.marketer_id = auth.uid() or public.is_admin()))
  );
