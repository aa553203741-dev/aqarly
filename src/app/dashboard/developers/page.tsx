import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { DevelopersManager } from "@/components/DevelopersManager";
import type { Developer } from "@/lib/inventory-types";

export default async function DevelopersPage() {
  const supabase = await createClient();
  const me = await getMe();
  const { data } = await supabase
    .from("developers")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-5">المطوّرون العقاريون</h1>
      <DevelopersManager
        initial={(data as Developer[]) ?? []}
        canManage={me?.canManageInventory ?? false}
      />
    </div>
  );
}
