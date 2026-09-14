-- ============================================================
--  عقارلي — المرحلة 25: تقليل الاعتماد على service_role في الوسائط
--
--  المخزن project-media خاص. كان توقيع كل رابط يتم بمفتاح service_role
--  على الخادم، فأي تلف لهذا المفتاح في البيئة يُعطّل كل الوسائط.
--
--  هذه السياسة تتيح للمستخدم *المسجّل* قراءة كائنات project-media،
--  فيصبح بإمكان الخادم توقيع روابط لوحة التحكم بجلسة المستخدم نفسه
--  بلا service_role. الزائر (anon) يبقى ممنوعًا — بطاقة المشاركة
--  العامة تُوقَّع خادميًا بـservice_role وحدها.
--
--  نفّذه بعد 23_private_media_session.sql. آمن ومتكرر.
-- ============================================================

drop policy if exists "project_media_auth_read" on storage.objects;
create policy "project_media_auth_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-media');
