-- ============================================================
--  عقارلي — الميزة: مشاركة الوحدة مع العميل (بطاقة عامة)
--  دالة آمنة تُرجع وحدة واحدة بمعرّفها للزائر (بلا كشف الجدول).
--  نفّذها بعد 10_inventory.sql.
-- ============================================================

create or replace function public.public_unit_card(p_unit_id uuid)
returns table(
  unit_no text, floor int, price numeric, discount_price numeric, status text,
  unit_view text, direction text,
  bedrooms int, area numeric, bathrooms int, model_name text, floor_plan_url text,
  project_name text, project_status text, cover_image text, maps_url text,
  lat double precision, lng double precision,
  developer_name text, city text, district_name text
)
language sql stable security definer set search_path = public as $$
  select
    u.unit_no, u.floor, u.price, u.discount_price, u.status,
    u.view, u.direction,
    m.bedrooms, m.area, m.bathrooms, m.name, m.floor_plan_url,
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
