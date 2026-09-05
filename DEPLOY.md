# دليل نشر «عقارلي» على Vercel

دليل خطوة بخطوة لتحويل التطبيق من التطوير المحلي إلى موقع حيّ على الإنترنت،
مع Supabase (الإنتاج) وMoyasar وإشعارات واتساب.

المدة المتوقعة: **30–45 دقيقة**. التسلسل مهم — اتبعه بالترتيب.

---

## 0) نظرة عامة على المعمارية

```
المستخدم ──▶ Vercel (تطبيق Next.js) ──▶ Supabase (قاعدة بيانات + مصادقة)
                     │
                     ├──▶ Moyasar (الدفع)  ──webhook──▶ /api/webhooks/moyasar
                     └──▶ WhatsApp Cloud API
     Supabase ──(تريغر عند طلب جديد)──▶ /api/notify/lead ──▶ واتساب
```

كل الأسرار على الخادم (Vercel Environment Variables). لا شيء سرّي في المتصفح.

---

## 1) الأدوات المطلوبة (حسابات مجانية)

- [ ] حساب [GitHub](https://github.com) (لرفع الكود)
- [ ] حساب [Vercel](https://vercel.com) (الاستضافة — سجّل الدخول بـGitHub)
- [ ] مشروع [Supabase](https://supabase.com)
- [ ] حساب [Moyasar](https://moyasar.com) (اختياري إن أردت الدفع الآن)
- [ ] تطبيق [Meta for Developers](https://developers.facebook.com) + WhatsApp (اختياري)

---

## 2) رفع الكود إلى GitHub

من داخل مجلد `aqarly`:

```bash
git init
git add .
git commit -m "عقارلي: النسخة الأولى"
```

> ملف `.gitignore` يستثني `.env*` تلقائيًا — **تأكّد ألا تُرفع مفاتيحك**.
> تحقّق: `git status` يجب ألا يُظهر `.env.local`.

ثم أنشئ مستودعًا فارغًا على GitHub واربطه:

```bash
git remote add origin https://github.com/USERNAME/aqarly.git
git branch -M main
git push -u origin main
```

---

## 3) إعداد Supabase للإنتاج

### 3.1 نفّذ المخطّطات بالترتيب
Supabase → **SQL Editor** → نفّذ الملفات الأربعة بالتسلسل:

1. [`supabase/schema.sql`](supabase/schema.sql) — الجداول + RLS + الدوال.
2. [`supabase/02_subscriptions.sql`](supabase/02_subscriptions.sql) — طلبات الترقية.
3. [`supabase/03_payments.sql`](supabase/03_payments.sql) — المدفوعات + `activate_premium`.
4. [`supabase/04_notifications.sql`](supabase/04_notifications.sql) — تريغر إشعار واتساب
   (بدّل `YOUR-DOMAIN` و`YOUR_NOTIFY_SECRET` أولًا — راجع الخطوة 6).

### 3.2 المصادقة
- **Authentication → URL Configuration**: اضبط **Site URL** على نطاقك النهائي
  (مثال: `https://aqarly.com`)، وأضِفه في **Redirect URLs**.
- **Authentication → Providers → Email**: أبقِ "Confirm email" مفعّلًا في الإنتاج
  (أطفئه فقط أثناء التجربة).

### 3.3 انسخ المفاتيح
**Project Settings → API**:
- `Project URL` → لمتغيّر `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → لمتغيّر `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → لمتغيّر `SUPABASE_SERVICE_ROLE_KEY` (⚠️ سرّي جدًا — للخادم فقط)

---

## 4) النشر على Vercel

1. Vercel → **Add New → Project** → اختر مستودع `aqarly` من GitHub.
2. **Framework Preset**: Next.js (يُكتشف تلقائيًا).
3. **Root Directory**: اتركه الجذر إن كان المستودع هو `aqarly` نفسه.
   (إن رفعت `C:\2026` كاملًا، اضبط Root Directory = `aqarly`.)
4. **Environment Variables**: أضِف كل المتغيّرات (الجدول في الخطوة 5) — لبيئة
   Production (وPreview إن رغبت).
5. اضغط **Deploy**. انتظر انتهاء البناء → ستحصل على رابط `https://aqarly-xxx.vercel.app`.

---

## 5) متغيّرات البيئة (Vercel → Settings → Environment Variables)

| المتغيّر | المصدر | سرّي؟ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → API | لا |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API | لا |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API | **نعم** |
| `MOYASAR_SECRET_KEY` | Moyasar → API Keys (`sk_...`) | **نعم** |
| `MOYASAR_WEBHOOK_SECRET` | تختاره أنت (نص عشوائي طويل) | **نعم** |
| `WHATSAPP_TOKEN` | Meta → WhatsApp → API Setup | **نعم** |
| `WHATSAPP_PHONE_ID` | Meta → WhatsApp → API Setup | لا |
| `WHATSAPP_TEMPLATE` | اسم القالب (مثال `new_lead`) | لا |
| `WHATSAPP_TEMPLATE_LANG` | لغة القالب (مثال `ar`) | لا |
| `NOTIFY_WEBHOOK_SECRET` | تختاره أنت (نص عشوائي طويل) | **نعم** |
| `NEXT_PUBLIC_SITE_URL` | نطاقك النهائي (مثال `https://aqarly.com`) | لا |
| `NEXT_PUBLIC_APP_NAME` | اسم التطبيق (`عقارلي`) | لا |

> بعد أي تعديل على المتغيّرات، اعمل **Redeploy** ليأخذ التغييرات.

---

## 6) ربط Moyasar بالنطاق الحقيقي

1. Moyasar Dashboard → **Webhooks** → أضِف:
   - **URL**: `https://نطاقك/api/webhooks/moyasar`
   - **Shared secret / token**: نفس قيمة `MOYASAR_WEBHOOK_SECRET`
   - **الحدث**: `payment_paid`
2. ابدأ بمفاتيح **الاختبار** (`sk_test_...`) وبطاقات
   [اختبار Moyasar](https://docs.moyasar.com/testing)، وبعد التأكّد بدّل لمفاتيح الإنتاج.

---

## 7) ربط إشعارات واتساب بالنطاق الحقيقي

1. حدّث تريغر Supabase بالنطاق والرمز الفعليين — نفّذ في SQL Editor:

```sql
create or replace function public.notify_new_lead()
returns trigger language plpgsql security definer
set search_path = public, extensions as $$
begin
  perform net.http_post(
    url     := 'https://نطاقك/api/notify/lead',
    headers := jsonb_build_object(
                 'Content-Type','application/json',
                 'x-notify-secret','قيمة_NOTIFY_WEBHOOK_SECRET'),
    body    := to_jsonb(new)
  );
  return new;
exception when others then return new;
end $$;
```

   (أو استخدم Supabase → Database → Webhooks بدل SQL.)
2. تأكّد أن قالب واتساب `new_lead` معتمد من Meta، وأن رقم أعمالك مفعّل.

---

## 8) ربط دومين مخصّص (اختياري)

1. Vercel → Project → **Settings → Domains** → أضِف `aqarly.com`.
2. اتبع تعليمات DNS (سجل A أو CNAME لدى مزوّد الدومين).
3. بعد التفعيل، **حدّث** `NEXT_PUBLIC_SITE_URL` و**Site URL** في Supabase وروابط
   webhooks في Moyasar وواتساب لتشير للدومين الجديد، ثم Redeploy.

---

## 9) فحص ما بعد النشر (Smoke Test)

- [ ] الصفحة الرئيسية تفتح على النطاق.
- [ ] إنشاء حساب وسيط جديد ينجح، ويظهر كوده في «الدعوات».
- [ ] فتح `/lead/<الكود>` وإرسال طلب تجريبي → يظهر في «طلبات العملاء».
- [ ] (إن فعّلت واتساب) وصول إشعار واتساب للوسيط.
- [ ] `/dashboard` يحوّل لتسجيل الدخول عند عدم وجود جلسة.
- [ ] (إن فعّلت الدفع) دفعة اختبار → العودة بنجاح → الخطة ترتفع لمميّز.
- [ ] عيّن أول أدمن ثم افتح `/admin` و`/admin/revenue`.

### تعيين أول أدمن
Supabase → SQL Editor (بدّل البريد):
```sql
update public.profiles set role='admin' where email='YOU@example.com';
```

---

## 10) قائمة الأمان قبل الإطلاق

- [ ] `.env.local` غير مرفوع إطلاقًا إلى Git (`git log -p | grep -i service_role` = فارغ).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` موجود في Vercel فقط، لا في العميل.
- [ ] كل الجداول مفعّل عليها RLS (نفّذ سكربت الفحص من المحادثة على نطاق الإنتاج).
- [ ] webhooks الدفع والإشعار محميّة بأسرار مشتركة قوية (٣٢+ حرفًا عشوائيًا).
- [ ] "Confirm email" مفعّل في الإنتاج.
- [ ] مفاتيح Moyasar تحوّلت من `test` إلى `live` بعد التأكّد.

---

## 11) استكشاف الأخطاء

| العرض | السبب المرجّح | الحل |
|---|---|---|
| صفحة بيضاء / خطأ 500 | متغيّر بيئة ناقص | راجع Vercel → Deployments → Logs |
| تسجيل الدخول لا يعمل | Site URL/Redirect غير مضبوط في Supabase | اضبط URL Configuration |
| الدفع ينجح لكن الخطة لا ترتفع | webhook Moyasar غير مضبوط أو الرمز خاطئ | تحقّق URL والرمز المشترك |
| لا تصل إشعارات واتساب | القالب غير معتمد / التريغر بالنطاق القديم | راجع الخطوة 7 وحالة القالب |
| `SUPABASE_SERVICE_ROLE_KEY غير مضبوط` | المتغيّر ناقص في Vercel | أضِفه ثم Redeploy |

---

## 12) التحديثات المستقبلية

كل `git push` إلى فرع `main` يُطلق **نشرًا تلقائيًا** على Vercel. الفروع الأخرى
تحصل على روابط **Preview** للتجربة قبل الدمج.
