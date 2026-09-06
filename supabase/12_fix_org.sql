-- ============================================================
--  عقارلي — إصلاح: ضمان org_id لكل مستخدم جديد
--  بدونه لا يرى المسوّق الجديد المخزون (سياسات RLS تعتمد org_id).
--  نفّذه بعد 10_inventory.sql. آمن ومتكرر.
-- ============================================================

create or replace function public.set_profile_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.org_id is null then
    new.org_id := (select id from public.orgs order by created_at limit 1);
  end if;
  return new;
end $$;

drop trigger if exists trg_profile_org on public.profiles;
create trigger trg_profile_org before insert on public.profiles
  for each row execute function public.set_profile_org();

-- ردم أي حسابات قائمة بلا org
update public.profiles
  set org_id = (select id from public.orgs order by created_at limit 1)
  where org_id is null;
