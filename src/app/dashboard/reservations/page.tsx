import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { ReservationsList } from "@/components/ReservationsList";
import type { Reservation } from "@/lib/inventory-types";

export default async function ReservationsPage() {
  const supabase = await createClient();
  const me = await getMe();

  const { data } = await supabase
    .from("reservations")
    .select("*, unit:units(unit_no), project:projects(name)")
    .order("created_at", { ascending: false });

  const list = (data as Reservation[]) ?? [];
  const earned = list
    .filter((r) => r.commission_status !== "pending" && r.stage !== "cancelled")
    .reduce((s, r) => s + (r.commission_amount ?? 0), 0);
  const pending = list
    .filter((r) => r.commission_status === "pending" && r.stage !== "cancelled")
    .reduce((s, r) => s + (r.commission_amount ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-4">حجوزاتي وعمولاتي</h1>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card p-4">
          <div className="text-2xl font-extrabold" style={{ color: "var(--brand)" }}>
            {earned.toLocaleString("en-US")} ر.س
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            عمولات مستحقة/مدفوعة
          </div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-extrabold" style={{ color: "var(--gold)" }}>
            {pending.toLocaleString("en-US")} ر.س
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            عمولات قيد الإجراء
          </div>
        </div>
      </div>

      <ReservationsList initial={list} canCancel={me?.canReserve ?? false} />
    </div>
  );
}
