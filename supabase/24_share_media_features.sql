-- ============================================================
--  عقارلي — المرحلة 24: مكوّنات الشقة اليدوية + إظهار الفيديو والصور
--                       في بطاقة المشاركة العامة
--
--  (أ) عمود features: مكوّنات/مزايا يضيفها المسوّق يدويًا لكل نموذج
--      (زيادة على المجلس/الصالة… الثابتة).
--  (ب) توسعة public_unit_card لتُرجع video_url وصور النموذج والمكوّنات،
--      حتى تظهر في الرابط الذي يصل العميل.
--
--  نفّذه بعد 21_model_media.sql. آمن ومتكرر.
-- ============================================================

alter table public.unit_models
  add column if not exists features text[] not null default '{}';

comment on column public.unit_models.features is
  'مكوّنات/مزايا الشقة المضافة يدويًا — تظهر للعميل';

-- تغيير قائمة الأعمدة المُرجَعة يستلزم حذف الدالة ثم إعادة إنشائها.
drop function if exists public.public_unit_card(uuid);

create function public.public_unit_card(p_unit_id uuid)
returns table(
  unit_no text, floor int, price numeric, discount_price numeric, status text,
  unit_view text, direction text,
  bedrooms int, area numeric, bathrooms int, model_name text, floor_plan_url text,
  images text[], video_url text, features text[],
  project_name text, project_status text, cover_image text, maps_url text,
  lat double precision, lng double precision,
  developer_name text, city text, district_name text
)
language sql stable security definer set search_path = public as $$
  select
    u.unit_no, u.floor, u.price, u.discount_price, u.status,
    u.view, u.direction,
    m.bedrooms, m.area, m.bathrooms, m.name, m.floor_plan_url,
    m.images, m.video_url, m.features,
    p.name, p.status, p.cover_image, p.maps_url, p.lat, p.lng,
    d.name, g.city, g.name
  from public.units u
    left join public.unit_models m on m.id = u.model_id
    join public.projects p on p.id = u.project_id
    left join public.developers d on d.id = p.developer_id
    left join public.districts g on g.id = p.district_id
  where u.id = p_unit_id
  limit 1;
$$;
grant execute on function public.public_unit_card(uuid) to anon, authenticated;
