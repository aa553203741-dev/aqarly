-- ============================================================
--  عقارلي — الميزة: الإشعارات داخل التطبيق
--  نفّذه بعد 10_inventory.sql.
-- ============================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid default public.current_org() references public.orgs(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text,
  title      text not null,
  body       text default '',
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;
revoke select on public.notifications from anon;

-- المستخدم يقرأ/يحدّث إشعاراته فقط (الإدراج عبر مشغّلات SECURITY DEFINER)
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- حجز جديد → إشعار للأدمن والموظفين المخوّلين بالدفع
create or replace function public.notify_new_reservation()
returns trigger language plpgsql security definer set search_path = public as $$
declare mkt text;
begin
  select coalesce(full_name, email) into mkt from public.profiles where id = new.marketer_id;
  insert into public.notifications(org_id, user_id, type, title, body, link)
  select new.org_id, p.id, 'reservation', 'حجز جديد',
         coalesce(mkt, 'مسوّق') || ' حجز وحدة', '/dashboard/deals'
  from public.profiles p
    left join public.user_permissions up on up.user_id = p.id
  where p.org_id = new.org_id
    and p.id <> new.marketer_id
    and (p.role = 'admin' or up.can_process_payments = true);
  return new;
end $$;
drop trigger if exists trg_notify_new_res on public.reservations;
create trigger trg_notify_new_res after insert on public.reservations
  for each row execute function public.notify_new_reservation();

-- تحديث الحجز → إشعار المسوّق عند الإقفال أو صرف العمولة
create or replace function public.notify_reservation_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.stage = 'closed' and old.stage is distinct from 'closed' then
    insert into public.notifications(org_id, user_id, type, title, body, link)
    values (new.org_id, new.marketer_id, 'deal_closed', 'اكتملت صفقتك',
            'تم إقفال الصفقة، وعمولتك أصبحت مستحقة', '/dashboard/reservations');
  end if;
  if new.commission_status = 'paid' and old.commission_status is distinct from 'paid' then
    insert into public.notifications(org_id, user_id, type, title, body, link)
    values (new.org_id, new.marketer_id, 'commission_paid', 'صُرفت عمولتك',
            'تم اعتماد صرف عمولتك', '/dashboard/reservations');
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_res_update on public.reservations;
create trigger trg_notify_res_update after update on public.reservations
  for each row execute function public.notify_reservation_update();
