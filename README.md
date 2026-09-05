# عقارلي (Aqarly)

أداة الوسيط العقاري الذكية — منصة تربط العملاء بالوسطاء وتدير الطلبات والعروض.
مبنية بـ **Next.js 16 + TypeScript + Tailwind + Supabase**، وواجهة عربية RTL،
و**حماية RLS صارمة من اليوم الأول**.

## الميزات

- **نموذج التقاط عملاء عام** — العميل يدخل كود الوسيط (أو رابطه) ويرسل طلبه مباشرة.
- **مصادقة الوسطاء** — تسجيل ودخول عبر Supabase Auth.
- **لوحة الوسيط** — نظرة عامة، طلبات العملاء (مع حالات المتابعة)، إدارة العروض.
- **المطابقة الذكية** — تطابق طلبات العملاء المفتوحة مع عروض الوسيط تلقائيًا.
- **التقارير (مميّزة)** — تصدير الطلبات والعروض إلى Excel (CSV)، وطباعة / حفظ PDF.
- **الاشتراكات + دفع Moyasar** — خطة مجانية ومميّزة، دفع حقيقي (mada/Apple Pay) وتفعيل تلقائي عبر webhook.
- **إشعارات واتساب** — يصل الوسيط إشعار فور وصول طلب عميل جديد (WhatsApp Cloud API).
- **الدعوات** — كود مشاركة لكل وسيط + رابط + مشاركة واتساب.
- **الإعدادات** — تعديل الملف الشخصي.
- **لوحة الأدمن** — إحصائيات، إدارة الوسطاء وخططهم، واعتماد طلبات الترقية.
- **لوحة الإيرادات (أدمن)** — إجمالي الإيراد، إيراد الشهر، الاشتراكات النشطة، رسم شهري، وسجل المدفوعات.

## الأمان (الفرق الجوهري)

- كل جدول محمي بـ **RLS**؛ لا قراءة علنية لأي بيانات شخصية.
- البحث العام عن الوسيط بالكود يتم عبر **دالة `lookup_broker_by_code` (SECURITY DEFINER)**
  تُرجع صفًا واحدًا فقط — **لا تعداد للجداول** (تجنّبنا هنا الثغرة الشائعة في المنصات المشابهة).
- إدراج طلبات العملاء من الزائر مسموح **بشرط** أن يكون الوسيط المستهدف موجودًا، مع
  دفاعات صامتة ضد البوتات (حقل خفي + حد زمني).

## الإعداد خطوة بخطوة

### 1) أنشئ مشروع Supabase
- من [supabase.com](https://supabase.com) أنشئ مشروعًا جديدًا (مجاني).
- من **Project Settings → API** انسخ:
  - `Project URL`
  - `anon public` key (أو `publishable`).

### 2) عبّئ متغيّرات البيئة
عدّل ملف `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_APP_NAME=عقارلي
```

### 3) نفّذ مخطّط قاعدة البيانات
- افتح **Supabase → SQL Editor**.
- الصق كامل محتوى [`supabase/schema.sql`](supabase/schema.sql) ونفّذه.
- ثم الصق [`supabase/02_subscriptions.sql`](supabase/02_subscriptions.sql) ونفّذه (نظام الاشتراكات).
- ثم الصق [`supabase/03_payments.sql`](supabase/03_payments.sql) ونفّذه (المدفوعات + دالة التفعيل).
- (لإشعارات واتساب) بدّل القيمتين داخل [`supabase/04_notifications.sql`](supabase/04_notifications.sql) ونفّذه.
- (اختياري) في **Authentication → Providers → Email** أطفئ "Confirm email"
  أثناء التطوير لتسجيل دخول فوري بلا تأكيد بريد.

### 4) شغّل التطبيق
```
npm install
npm run dev
```
افتح http://localhost:3000

### 5) عيّن أول أدمن
بعد إنشاء حسابك الأول، نفّذ في SQL Editor (بدّل البريد):
```sql
update public.profiles set role='admin' where email='YOU@example.com';
```
ثم حدّث الصفحة — سيظهر رابط «لوحة الأدمن».

## ربط الدفع (Moyasar)

الدفع يُفعّل الاشتراك تلقائيًا عبر **webhook** يتحقّق من الدفعة مباشرة مع Moyasar.

1. أنشئ حساب [Moyasar](https://moyasar.com) واحصل من **Settings → API Keys** على
   `secret key` (`sk_...`).
2. من **Supabase → Project Settings → API** انسخ `service_role` key.
3. أضِف المتغيّرات في `.env.local` (كلها سرّية عدا `NEXT_PUBLIC_SITE_URL`):
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   MOYASAR_SECRET_KEY=sk_test_...
   MOYASAR_WEBHOOK_SECRET=رمز-عشوائي-طويل-تختاره-أنت
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```
4. في لوحة Moyasar → **Webhooks** أضِف:
   - **URL**: `https://your-domain.com/api/webhooks/moyasar`
   - **Secret token**: نفس قيمة `MOYASAR_WEBHOOK_SECRET`.
   - الحدث: `payment_paid`.
5. للتجربة المحلية استخدم أداة نفق (مثل `ngrok`) لتصل Moyasar إلى webhook جهازك،
   وبطاقات الاختبار من [توثيق Moyasar](https://docs.moyasar.com/testing).

**تدفّق الدفع:** الوسيط يضغط «الدفع والاشتراك» → إنشاء فاتورة على الخادم →
صفحة دفع Moyasar (mada/Apple Pay/بطاقة) → العودة للتطبيق → الـwebhook يتحقّق
من الدفعة ويرفع الخطة إلى `premium` تلقائيًا.

**الأمان:** المفاتيح السرّية على الخادم فقط؛ الـwebhook يتحقّق من الرمز المشترك
**ثم يعيد جلب الدفعة من Moyasar** قبل التفعيل (لا يثق بجسم الطلب وحده)؛ ورفع الخطة
يتم عبر دالة `activate_premium` وحدها (لا كتابة مباشرة على الخطة من العميل).

## إشعارات واتساب (WhatsApp Cloud API)

يصل الوسيط إشعار واتساب فور وصول طلب عميل جديد.

1. من [Meta for Developers](https://developers.facebook.com) أنشئ تطبيقًا وأضِف
   منتج **WhatsApp**، واحصل من **API Setup** على:
   - `Access Token` → `WHATSAPP_TOKEN`
   - `Phone number ID` → `WHATSAPP_PHONE_ID`
2. أنشئ **قالب رسالة** (Message Template) معتمدًا، بجسم فيه متغيّر واحد `{{1}}`، مثال:
   > لديك طلب عميل جديد في عقارلي: {{1}}

   وسمِّه `new_lead` بلغة `ar` (أو غيّر `WHATSAPP_TEMPLATE` / `WHATSAPP_TEMPLATE_LANG`).
   نمرّر ملخّص الطلب كاملًا في `{{1}}`.
3. أضِف في `.env.local`: `WHATSAPP_TOKEN` و`WHATSAPP_PHONE_ID` و`NOTIFY_WEBHOOK_SECRET`.
4. فعّل التريغر بأحد الطريقين:
   - **SQL**: بدّل النطاق والرمز في [`supabase/04_notifications.sql`](supabase/04_notifications.sql) ونفّذه.
   - **أو Dashboard**: Supabase → Database → Webhooks → جدول `client_leads`، حدث
     `INSERT`، POST إلى `https://نطاقك/api/notify/lead`، ورأس `x-notify-secret`
     بنفس قيمة `NOTIFY_WEBHOOK_SECRET`.

**الأمان:** مفاتيح واتساب على الخادم فقط؛ نقطة `/api/notify/lead` ترفض أي نداء بلا
الرمز المشترك؛ وأي خطأ في الإشعار لا يُفشل حفظ طلب العميل.

## التشغيل

- `npm run dev` — خادم التطوير.
- `npm run build` — بناء الإنتاج.
- `npm start` — تشغيل نسخة الإنتاج.

## النشر
دليل كامل خطوة بخطوة (Vercel + Supabase + Moyasar + واتساب) في **[DEPLOY.md](DEPLOY.md)**.

## تغيير اسم التطبيق
غيّر `NEXT_PUBLIC_APP_NAME` في `.env.local` — يتغيّر الاسم في كل الواجهة تلقائيًا.
