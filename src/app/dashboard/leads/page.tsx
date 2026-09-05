import { createClient } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/LeadsTable";
import type { ClientLead } from "@/lib/types";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-5">طلبات العملاء</h1>
      <LeadsTable initial={(data as ClientLead[]) ?? []} />
    </div>
  );
}
