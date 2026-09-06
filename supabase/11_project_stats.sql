-- ============================================================
--  عقارلي — المرحلة 5: view إحصاءات المشروع (محسوبة، بلا تكرار)
--  نفّذه بعد 10_inventory.sql.
-- ============================================================

drop view if exists public.project_stats;
create view public.project_stats with (security_invoker = true) as
select
  p.id      as project_id,
  p.org_id,
  p.district_id,
  (select count(*) from public.units u where u.project_id = p.id) as total_units,
  (select count(*) from public.units u where u.project_id = p.id and u.status = 'available') as available_units,
  (select min(coalesce(u.discount_price, u.price))
     from public.units u where u.project_id = p.id and u.status = 'available') as start_price,
  (select min(m.area)     from public.unit_models m where m.project_id = p.id) as min_area,
  (select max(m.area)     from public.unit_models m where m.project_id = p.id) as max_area,
  (select min(m.bedrooms) from public.unit_models m where m.project_id = p.id) as min_bed,
  (select max(m.bedrooms) from public.unit_models m where m.project_id = p.id) as max_bed
from public.projects p;
