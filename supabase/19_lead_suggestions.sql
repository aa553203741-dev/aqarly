-- ============================================================
--  عقارلي — الميزة: اقتراح عقار لطلب العميل
--  ربط طلب العميل (client_leads) بوحدة من المخزون أو عرض متاح.
--  نُخزّن لقطة (snapshot) للعنوان/السعر حتى يبقى الاقتراح ظاهرًا
--  حتى لو تغيّرت حالة الوحدة أو حُذف العرض.
--  نفّذه بعد 10_inventory.sql.
-- ============================================================

create table if not exists public.lead_suggestions (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.client_leads(id) on delete cascade,
  kind        text not null check (kind in ('unit','listing')),
  ref_id      uuid not null,                 -- units.id أو listings.id (لقطة، بلا FK)
  title       text not null default '',
  subtitle    text not null default '',
  price       numeric,
  note        text not null default '',
  created_by  uuid not null default auth.uid() references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (lead_id, kind, ref_id)
);
create index if not exists idx_lead_sugg_lead on public.lead_suggestions(lead_id, created_at desc);

alter table public.lead_suggestions enable row level security;
revoke select on public.lead_suggestions from anon;

-- صاحب الطلب (المسوّق الذي جاءه الطلب عبر كوده) أو الأدمن يديران الاقتراحات
drop policy if exists lead_sugg_own on public.lead_suggestions;
create policy lead_sugg_own on public.lead_suggestions
  for all to authenticated
  using (
    exists (
      select 1 from public.client_leads l
      where l.id = lead_id
        and (l.broker_user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.client_leads l
      where l.id = lead_id
        and (l.broker_user_id = auth.uid() or public.is_admin())
    )
  );
