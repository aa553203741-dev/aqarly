"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RESERVATION_STAGE } from "@/lib/inventory-constants";
import type { Reservation } from "@/lib/inventory-types";

function stageLabel(v: string) {
  return RESERVATION_STAGE.find((s) => s.value === v)?.label ?? v;
}
const stageColor: Record<string, string> = {
  reserved: "#d97706",
  documents: "#2563eb",
  down_payment: "#2563eb",
  paying: "#2563eb",
  paid: "#0d7a6e",
  closed: "#16a34a",
  cancelled: "#6b7280",
};
const commLabel: Record<string, string> = {
  pending: "قيد الإجراء",
  earned: "مستحقة",
  paid: "مدفوعة",
};

export function ReservationsList({
  initial,
  canCancel,
}: {
  initial: Reservation[];
  canCancel: boolean;
}) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState("");

  async function cancel(id: string) {
    if (!confirm("إلغاء الحجز؟ ستعود الوحدة متاحة.")) return;
    setBusy(id);
    const supabase = createClient();
    const { error } = await supabase.rpc("advance_reservation", {
      p_res_id: id,
      p_new_stage: "cancelled",
    });
    setBusy("");
    if (!error) {
      setRows((rs) =>
        rs.map((r) => (r.id === id ? { ...r, stage: "cancelled" } : r)),
      );
    }
  }

  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
        لا توجد حجوزات بعد. احجز وحدة من «البحث».
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.id} className="card p-4">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="font-bold">
                {r.project?.name} — وحدة {r.unit?.unit_no}
              </div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                العميل: {r.client_name || "—"}
                {r.client_phone ? ` · ${r.client_phone}` : ""}
              </div>
            </div>
            <span
              className="badge"
              style={{ background: stageColor[r.stage] ?? "#6b7280", color: "#fff" }}
            >
              {stageLabel(r.stage)}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap mt-3 text-sm items-center">
            {r.agreed_price != null && (
              <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
                السعر {Number(r.agreed_price).toLocaleString("en-US")} ر.س
              </span>
            )}
            {r.commission_amount != null && (
              <span className="badge" style={{ background: "#fef9c3", color: "#854d0e" }}>
                عمولتك {Number(r.commission_amount).toLocaleString("en-US")} ر.س ·{" "}
                {commLabel[r.commission_status]}
              </span>
            )}
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {new Date(r.reserved_at).toLocaleDateString("ar-SA")}
            </span>
          </div>

          {canCancel && ["reserved", "documents"].includes(r.stage) && (
            <button
              onClick={() => cancel(r.id)}
              className="btn btn-ghost !py-1.5 !px-3 text-sm mt-3"
              style={{ color: "var(--danger)" }}
              disabled={busy === r.id}
            >
              {busy === r.id ? "..." : "إلغاء الحجز"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
