import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { DealsPipeline } from "@/components/DealsPipeline";
import type { Reservation } from "@/lib/inventory-types";

export default async function DealsPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!(me.isAdmin || me.canProcessPayments || me.canCloseDeals)) {
    redirect("/dashboard/reservations");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("reservations")
    .select(
      "*, unit:units(unit_no), project:projects(name), marketer:profiles!reservations_marketer_id_fkey(full_name, email)",
    )
    .neq("stage", "cancelled")
    .order("created_at", { ascending: false });

  const list = (data as Reservation[]) ?? [];

  // إجمالي المدفوع لكل حجز
  const ids = list.map((r) => r.id);
  const { data: pays } = ids.length
    ? await supabase.from("deal_payments").select("reservation_id, amount").in("reservation_id", ids)
    : { data: [] };
  const paidMap: Record<string, number> = {};
  for (const p of (pays as { reservation_id: string; amount: number }[]) ?? []) {
    paidMap[p.reservation_id] = (paidMap[p.reservation_id] ?? 0) + Number(p.amount);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-4">لوحة المعاملات</h1>
      <DealsPipeline
        initial={list}
        paidMap={paidMap}
        canProcess={me.canProcessPayments}
        canClose={me.canCloseDeals}
        canApproveCommission={me.isAdmin || (me.perms?.can_view_all_commissions ?? false)}
      />
    </div>
  );
}
