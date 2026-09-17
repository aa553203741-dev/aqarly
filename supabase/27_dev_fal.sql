-- ============================================================
--  عقارلي — ميزات: رقم رخصة فال + صفحة مطوّر عامة
--
--  (أ) fal_license على profiles — رقم رخصة الوسيط العقاري (فال/ريجا).
--      نمنح صلاحية تعديله للمستخدم (المرحلة 22 سحبت تعديل الأعمدة).
--  (ب) public_developer: دالة عامة تُرجع مطوّرًا ومشاريعه للزائر.
--  (ج) نضيف developer_id لبطاقة الوحدة العامة لربطها بصفحة المطوّر.
--
--  نفّذه بعد 24_share_media_features.sql. آمن ومتكرر.
-- ============================================================

-- (أ) رقم رخصة فال ------------------------------------------
alter table public.profiles
  add column if not exists fal_license text;
grant update (fal_license) on public.profiles to authenticated;

-- نسخ الرقم عند التسجيل إن أُدخل (اختياري في نموذج التسجيل)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email, full_name, phone, fal_license)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name',''),
          coalesce(new.raw_user_meta_data->>'phone',''),
          nullif(new.raw_user_meta_data->>'fal_license',''))
  on conflict (id) do nothing;
  return new;
end $$;

-- (ب) صفحة المطوّر العامة ------------------------------------
create or replace function public.public_developer(p_dev uuid)
returns table(
  developer_id uuid, developer_name text, logo_url text,
  project_id uuid, project_name text, project_status text, cover_image text,
  city text, district_name text,
  total_units int, available_units int, start_price numeric
)
language sql stable security definer set search_path = public as $$
  select
    d.id, d.name, d.logo_url,
    p.id, p.name, p.status, p.cover_image,
    g.city, g.name,
    (select count(*)::int from public.units u where u.project_id = p.id),
    (select count(*)::int from public.units u
      where u.project_id = p.id and u.status = 'available'),
    (select min(coalesce(u.discount_price, u.price)) from public.units u
      where u.project_id = p.id and u.status = 'available')
  from public.developers d
    join public.projects p on p.developer_id = d.id
    left join public.districts g on g.id = p.district_id
  where d.id = p_dev
  order by p.created_at desc;
$$;
grant execute on function public.public_developer(uuid) to anon, authenticated;

-- (ج) إضافة developer_id لبطاقة الوحدة العامة ----------------
drop function if exists public.public_unit_card(uuid);

create function public.public_unit_card(p_unit_id uuid)
returns table(
  unit_no text, floor int, price numeric, discount_price numeric, status text,
  unit_view text, direction text,
  bedrooms int, area numeric, bathrooms int, model_name text, floor_plan_url text,
  images text[], video_url text, features text[],
  project_name text, project_status text, cover_image text, maps_url text,
  lat double precision, lng double precision,
  developer_id uuid, developer_name text, city text, district_name text
)
language sql stable security definer set search_path = public as $$
  select
    u.unit_no, u.floor, u.price, u.discount_price, u.status,
    u.view, u.direction,
    m.bedrooms, m.area, m.bathrooms, m.name, m.floor_plan_url,
    m.images, m.video_url, m.features,
    p.name, p.status, p.cover_image, p.maps_url, p.lat, p.lng,
    d.id, d.name, g.city, g.name
  from public.units u
    left join public.unit_models m on m.id = u.model_id
    join public.projects p on p.id = u.project_id
    left join public.developers d on d.id = p.developer_id
    left join public.districts g on g.id = p.district_id
  where u.id = p_unit_id
  limit 1;
$$;
grant execute on function public.public_unit_card(uuid) to anon, authenticated;
