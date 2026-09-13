import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// قراءة مفاتيح الإعدادات العامة (مغلّفة بـcache لكل طلب).
export const getPublicSettings = cache(async function getPublicSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["media_link_minutes", "session_minutes"]);
  const map = new Map(
    ((data as { key: string; value: string }[]) ?? []).map((r) => [r.key, r.value]),
  );
  return {
    mediaLinkSeconds: minutesToSeconds(map.get("media_link_minutes"), 60),
    sessionMinutes: intOr(map.get("session_minutes"), 480),
  };
});

function intOr(v: string | undefined, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
function minutesToSeconds(v: string | undefined, fallbackMin: number) {
  return intOr(v, fallbackMin) * 60;
}
