"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { INTEREST_STATUS } from "@/lib/inventory-constants";
import type { InterestStatus } from "@/lib/inventory-types";

export type ClientUnitRow = {
  id: string;
  status: InterestStatus;
  unit?: {
    unit_no: string;
    price: number | null;
    status: string;
    model?: { bedrooms: number | null; area: number | null } | null;
    project?: { name: string } | null;
  } | null;
};

export function ClientUnits({ initial }: { initial: ClientUnitRow[] }) {
  const [rows, setRows] = useState(initial);

  async function setStatus(id: string, status: InterestStatus) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const supabase = createClient();
    await supabase.from("client_units").update({ status }).eq("id", id);
  }

  async function remove(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id));
    const supabase = createClient();
    await supabase.from("client_units").delete().eq("id", id);
  }

  if (rows.length === 0) {
    return (
      <div className="card p-6 text-center" style={{ color: "var(--muted)" }}>
        لم تُضِف وحدات لهذا العميل بعد.
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
                {r.unit?.project?.name} — وحدة {r.unit?.unit_no}
              </div>
              <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                {r.unit?.model?.bedrooms != null && <span>{r.unit.model.bedrooms} غرف · </span>}
                {r.unit?.model?.area != null && <span>{r.unit.model.area} م² · </span>}
                {r.unit?.price != null && (
                  <span>{Number(r.unit.price).toLocaleString("en-US")} ر.س</span>
                )}
              </div>
            </div>
            <select
              className="field !w-auto !py-1.5 text-sm font-bold"
              value={r.status}
              onChange={(e) => setStatus(r.id, e.target.value as InterestStatus)}
            >
              {INTEREST_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => remove(r.id)}
            className="btn btn-ghost !py-1 !px-3 text-xs mt-2"
            style={{ color: "var(--danger)" }}
          >
            إزالة
          </button>
        </div>
      ))}
    </div>
  );
}
