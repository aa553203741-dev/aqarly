import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import type { UserPermissions } from "@/lib/inventory-types";

// يحمّل المستخدم الحالي + دوره + صلاحياته (للخادم — لتقييد الواجهة).
// مغلّف بـcache: لا يتكرّر الاستعلام إن استُدعي أكثر من مرة في نفس الطلب.
export const getMe = cache(async function getMe() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: perms }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_permissions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const p = profile as Profile | null;
  const pr = perms as UserPermissions | null;
  const isAdmin = p?.role === "admin";

  return {
    userId: user.id,
    profile: p,
    perms: pr,
    isAdmin,
    canManageInventory: isAdmin || pr?.can_manage_inventory === true,
    canReserve: isAdmin || pr?.can_reserve !== false,
    canProcessPayments: isAdmin || pr?.can_process_payments === true,
    canCloseDeals: isAdmin || pr?.can_close_deals === true,
  };
});

// أحياء تغطية المستخدم الحالي: null = بلا قيد (أدمن أو بلا تغطية = يرى الكل)
export const coveredDistrictIds = cache(async function coveredDistrictIds() {
  const me = await getMe();
  if (!me || me.isAdmin) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketer_coverage")
    .select("district_id");
  const ids = ((data as { district_id: string }[]) ?? []).map((c) => c.district_id);
  return ids.length > 0 ? ids : null;
});
