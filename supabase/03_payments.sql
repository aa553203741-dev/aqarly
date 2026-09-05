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
