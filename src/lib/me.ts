import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import type { UserPermissions } from "@/lib/inventory-types";

// يحمّل المستخدم الحالي + دوره + صلاحياته (للخادم — لتقييد الواجهة).
export async function getMe() {
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
}
