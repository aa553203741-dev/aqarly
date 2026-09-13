// أداة عرض الوسائط — آمنة للعميل والخادم (بلا أي استيراد خادمي).
// المخزن project-media صار خاصًا، فكل عرض يمرّ عبر وسيط /api/media
// الذي يعيد توجيهًا إلى رابط موقّع ينتهي بعد مدة يحدّدها الأدمن.

const BUCKET = "project-media";

// استخرج المسار داخل الباكت من رابط عام قديم أو مسار مخزّن حديثًا.
// يعيد null لرابط خارجي (مثل يوتيوب) فلا يُلمس.
export function storagePath(v?: string | null): string | null {
  if (!v) return null;
  const marker = `/${BUCKET}/`;
  const i = v.indexOf(marker);
  if (i !== -1) return v.slice(i + marker.length).split("?")[0];
  if (/^https?:\/\//i.test(v)) return null; // رابط خارجي
  return v.replace(/^\/+/, ""); // مسار مجرّد مخزّن حديثًا
}

// حوّل قيمة مخزّنة إلى رابط عرض صالح.
// - ملف في مخزننا  => /api/media?p=<path>  (وسيط يوقّع الرابط)
// - رابط خارجي     => كما هو
// - فارغ            => undefined
export function mediaSrc(v?: string | null): string | undefined {
  if (!v) return undefined;
  const p = storagePath(v);
  if (!p) return v; // خارجي
  return `/api/media?p=${encodeURIComponent(p)}`;
}
