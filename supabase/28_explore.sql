-- ============================================================
--  عقارلي — الميزة: كتالوج عام للتصفّح (/explore)
--
--  يعرض الوحدات المتاحة للزائر مع فلاتر. حقول عامة آمنة فقط
--  (بلا عمولات ولا ملاحظات داخلية). دوال SECURITY DEFINER تتجاوز RLS
--  لكنها تُرجع المتاح فقط. يمكن قصر النتائج على منشأة عبر كود المسوّق.
--
--  نفّذه بعد 24_share_media_features.sql. آمن ومتكرر.
-- ============================================================

-- الوحدات المتاحة مع الفلاتر ---------------------------------
create or replace function public.public_explore(
  p_city        text    default null,
  p_district    uuid    default null,
  p_bedrooms    int     default null,
  p_price_min   numeric default null,
  p_price_max   numeric default null,
  p_broker_code text    default null,
  p_limit       int     default 60
)
returns table(
  id uuid, unit_no text, price numeric, discount_price numeric,
  bedrooms int, area numeric, bathrooms int,
  project_id uuid, project_name text, project_status text, cover_image text,
  developer_id uuid, developer_name text,
  city text, district_id uuid, district_name text
)
language sql stable security definer set search_path = public as $$
  with scope as (
    select case
      when coalesce(trim(p_broker_code), '') <> '' then (
        select p.org_id from public.profiles p
          join public.broker_codes bc on bc.user_id = p.id
         where bc.code = upper(trim(p_broker_code))
         limit 1)
      else null end as org
  )
  select
    u.id, u.unit_no, u.price, u.discount_price,
    m.bedrooms, m.area, m.bathrooms,
    p.id, p.name, p.status, p.cover_image,
    d.id, d.name,
    g.city, g.id, g.name
  from public.units u
    join public.projects p on p.id = u.project_id
    left join public.unit_models m on m.id = u.model_id
    left join public.developers d on d.id = p.developer_id
    left join public.districts g on g.id = p.district_id
    cross join scope s
  where u.status = 'available'
    and (s.org is null or u.org_id = s.org)
    and (p_city is null or g.city = p_city)
    and (p_district is null or g.id = p_district)
    and (p_bedrooms is null or m.bedrooms = p_bedrooms)
    and (p_price_min is null or coalesce(u.discount_price, u.price) >= p_price_min)
    and (p_price_max is null or coalesce(u.discount_price, u.price) <= p_price_max)
  order by coalesce(u.discount_price, u.price) asc nulls last
  limit greatest(1, least(coalesce(p_limit, 60), 120));
$$;
grant execute on function public.public_explore(text, uuid, int, numeric, numeric, text, int)
  to anon, authenticated;

-- خيارات الفلاتر: الأحياء التي فيها وحدات متاحة ----------------
create or replace function public.public_districts(p_broker_code text default null)
returns table(id uuid, city text, name text)
language sql stable security definer set search_path = public as $$
  with scope as (
    select case
      when coalesce(trim(p_broker_code), '') <> '' then (
        select p.org_id from public.profiles p
          join public.broker_codes bc on bc.user_id = p.id
         where bc.code = upper(trim(p_broker_code))
         limit 1)
      else null end as org
  )
  select distinct g.id, g.city, g.name
  from public.districts g
    join public.projects p on p.district_id = g.id
    join public.units u on u.project_id = p.id and u.status = 'available'
    cross join scope s
  where (s.org is null or u.org_id = s.org)
  order by g.city, g.name;
$$;
grant execute on function public.public_districts(text) to anon, authenticated;
