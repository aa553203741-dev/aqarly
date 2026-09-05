import { createClient } from "@/lib/supabase/server";
import { ListingsManager } from "@/components/ListingsManager";
import type { Listing } from "@/lib/types";

export default async function ListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-5">عروضي العقارية</h1>
      <ListingsManager
        initial={(data as Listing[]) ?? []}
        userId={user?.id ?? ""}
      />
    </div>
  );
}
