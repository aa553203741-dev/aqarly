-- ============================================================
--  عقارلي — المرحلة 21: وسائط نموذج الوحدة
--
--  كان unit_models يحمل floor_plan_url فقط (رابط واحد يُلصق يدويًا).
--  هذا الملف يضيف: معرض صور، ورابط فيديو.
--  المخطط نفسه يبقى في floor_plan_url لكنه صار يُرفع لا يُلصق.
--
--  نفّذه بعد 13_storage.sql. آمن ومتكرر.
-- ============================================================

alter table public.unit_models
  add column if not exists images    text[] not null default '{}',
  add column if not exists video_url text;

comment on column public.unit_models.floor_plan_url is
  'مخطط الشقة — صورة أو PDF في مخزن project-media';
comment on column public.unit_models.images is
  'معرض صور النموذج — روابط عامة في مخزن project-media';
comment on column public.unit_models.video_url is
  'جولة فيديو للنموذج — ملف في project-media أو رابط خارجي';

-- ------------------------------------------------------------
--  حد حجم الملف ونوعه على مستوى المخزن
--
--  الفيديو يحتاج سقفًا أعلى من الصور. 50 ميجابايت سقف معقول
--  لجولة قصيرة؛ ارفعه إن احتجت، وراقب فاتورة التخزين.
-- ------------------------------------------------------------
update storage.buckets
   set file_size_limit = 52428800,   -- 50 MB
       allowed_mime_types = array[
         'image/jpeg','image/png','image/webp','image/gif','image/avif',
         'application/pdf',
         'video/mp4','video/webm','video/quicktime'
       ]
 where id = 'project-media';

-- ============================================================
--  ملاحظة أمنية — اقرأها ولا تنفّذ شيئًا الآن
--
--  مخزن project-media عام (public = true) وسياسة القراءة:
--      create policy "project_media_read" on storage.objects
--        for select using (bucket_id = 'project-media');
--
--  أي شخص يملك الرابط يفتح الملف بلا تسجيل دخول — وهذا مقصود
--  للصور التي تُعرض للعملاء، لكنه يعني أن مخططات الشقق والفيديو
--  مكشوفة لمن يصله الرابط.
--
--  إن أردت قصرها على المسجّلين، تحتاج تحويل المخزن إلى خاص
--  واستخدام روابط موقّتة (signed URLs) في الواجهة. هذا تغيير
--  يكسر كل الروابط المحفوظة حاليًا، فلم أنفّذه. قل لي إن أردته.
-- ============================================================
