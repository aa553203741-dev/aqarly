-- ============================================================
--  عقارلي — الميزة: أكواد دعوة المسوّقين/الموظفين
--  الأدمن يُصدر كودًا بدور محدّد، والمستخدم الجديد يسجّل به فينضم
--  للمنشأة بالدور الصحيح. نفّذه بعد 10_inventory.sql.
-- ============================================================

create table if not exists public.invite_codes (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.current_org() references public.orgs(id) on delete cascade,
  code        text not null unique,
  role        text not null default 'marketer' check (role in ('marketer','staff','viewer')),
  note        text default '',
  created_by  uuid references public.profiles(id),
  used_by     uuid references public.profiles(id),
  used_at     timestamptz,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.invite_codes enable row level security;
revoke select on public.invite_codes from anon;

-- الأدمن يدير الأكواد
drop policy if exists invites_admin on public.invite_codes;
create policy invites_admin on public.invite_codes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- توليد كود دعوة (الأدمن فقط) — يُرجع الكود
create or replace function public.gen_invite(p_role text default 'marketer', p_note text default '')
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.is_admin() then raise exception 'غير مصرّح'; end if;
  if p_role not in ('marketer','staff','viewer') then p_role := 'marketer'; end if;
  loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.invite_codes where code = c);
  end loop;
  insert into public.invite_codes(org_id, code, role, note, created_by)
    values (public.current_org(), c, p_role, p_note, auth.uid());
  return c;
end $$;
grant execute on function public.gen_invite(text, text) to authenticated;

-- استخدام كود الدعوة (المستخدم الجديد) — يضبط دوره ومنشأته
create or replace function public.redeem_invite(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare inv public.invite_codes;
begin
  select * into inv from public.invite_codes
    where code = upper(trim(p_code)) and active and used_by is null
    for update;
  if inv.id is null then return 'invalid'; end if;

  update public.profiles set role = inv.role, org_id = inv.org_id
    where id = auth.uid();
  update public.invite_codes
    set used_by = auth.uid(), used_at = now(), active = false
    where id = inv.id;
  return 'ok';
end $$;
grant execute on function public.redeem_invite(text) to authenticated;
