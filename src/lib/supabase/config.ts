// إعداد اتصال Supabase العام (URL + مفتاح anon).
// هذان القيمتان عامّتان بطبيعتهما (تظهران في كل متصفح؛ الحماية عبر RLS)،
// لذا نحتفظ بقيمة احتياطية صحيحة تُستخدم إذا كانت قيمة البيئة مفقودة أو
// تالفة (مثل لصق خاطئ في لوحة الاستضافة). مفتاح service_role السرّي لا
// يُوضع هنا إطلاقًا — يبقى في متغيّر بيئة الخادم فقط.

const FALLBACK_URL = "https://sdakdodhaczmnwrxgycm.supabase.co";
const FALLBACK_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYWtkb2RoYWN6bW53cnhneWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NjUzOTksImV4cCI6MjEwNDE0MTM5OX0.sNGwZvDfErjRfNC3fvvKHbFQLLAJpQSKE52_r7Usv5Q";

// أحرف قابلة للاستخدام في ترويسة HTTP (ASCII مطبوع فقط، بلا مسافات)
const isHeaderSafe = (s?: string): s is string =>
  !!s && /^[\x21-\x7e]+$/.test(s);

export function supabaseConfig() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return {
    url: isHeaderSafe(envUrl) && envUrl.startsWith("https://") ? envUrl : FALLBACK_URL,
    anonKey: isHeaderSafe(envKey) && envKey.length > 100 ? envKey : FALLBACK_ANON,
  };
}
