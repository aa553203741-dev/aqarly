import { createClient } from "@/lib/supabase/server";
import { ClientsManager } from "@/components/ClientsManager";
import type { Client } from "@/lib/inventory-types";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-5">عملائي</h1>
      <ClientsManager initial={(data as Client[]) ?? []} />
    </div>
  );
}
