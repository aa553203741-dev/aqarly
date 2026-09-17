import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicSettings } from "@/lib/settings";
import { storagePath } from "@/lib/media-url";

// توقيع خادمي لوسائط الصفحات العامة (الزائر غير مسجّل، فلا يمرّ بوسيط /api/media).
// يعيد Map من المسار → رابط موقّع، مع دالة sign جاهزة للاستعمال.
export async function signPublicMedia(values: (string | null | undefined)[]) {
  const wanted = [
    ...new Set(values.map(storagePath).filter((p): p is string => !!p)),
  ];
  const map = new Map<string, string>();
  if (wanted.length > 0) {
    const { mediaLinkSeconds } = await getPublicSettings();
    const admin = createAdminClient();
    const { data } = await admin.storage
      .from("project-media")
      .createSignedUrls(wanted, mediaLinkSeconds);
    (data ?? []).forEach((r) => {
      if (r.path && r.signedUrl) map.set(r.path, r.signedUrl);
    });
  }
  const sign = (v: string | null | undefined) => {
    const p = storagePath(v);
    return (p && map.get(p)) || v || undefined;
  };
  return { map, sign };
}
