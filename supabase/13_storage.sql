-- ============================================================
--  عقارلي — المرحلة 10: تخزين صور المشاريع (Supabase Storage)
--  نفّذه بعد 10_inventory.sql.
-- ============================================================

-- إنشاء مخزن عام لصور/مخططات المشاريع
insert into storage.buckets (id, name, public)
  values ('project-media', 'project-media', true)
  on conflict (id) do nothing;

-- قراءة عامة (الصور تظهر للجميع)
drop policy if exists "project_media_read" on storage.objects;
create policy "project_media_read" on storage.objects
  for select using (bucket_id = 'project-media');

-- الرفع/التعديل/الحذف: من يملك صلاحية إدارة المخزون فقط
drop policy if exists "project_media_insert" on storage.objects;
create policy "project_media_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-media' and public.has_perm('can_manage_inventory'));

drop policy if exists "project_media_update" on storage.objects;
create policy "project_media_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-media' and public.has_perm('can_manage_inventory'));

drop policy if exists "project_media_delete" on storage.objects;
create policy "project_media_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-media' and public.has_perm('can_manage_inventory'));
