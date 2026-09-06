import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { SearchClient } from "@/components/SearchClient";
import type { Developer, District } from "@/lib/inventory-types";

export default async function SearchPage() {
  const supabase = await createClient();
  const me = await getMe();
  const [{ data: districts }, { data: developers }] = await Promise.all([
    supabase.from("districts").select("*").order("city"),
    supabase.from("developers").select("*").order("name"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-4">البحث الذكي</h1>
      <SearchClient
        districts={(districts as District[]) ?? []}
        developers={(developers as Developer[]) ?? []}
        canReserve={me?.canReserve ?? false}
      />
    </div>
  );
}
