"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UpgradeRow = {
  id: string;
  user_id: string;
  billing: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
};

export function AdminUpgrades({ initial }: { initial: UpgradeRow[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string>("");

  async function approve(id: string) {
    setBusy(id);
    const supabase = createClient();
    const { error } = await supabase.rpc("approve_upgrade", { p_request_id: id });
    setBusy("");
    if (!error) setRows((rs) => rs.filter((r) => r.id !== id));
  }

  async function reject(id: string) {
    setBusy(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("upgrade_requests")
      .update({ status: "rejected", decided_at: new Date().toISOString() })
      .eq("id", id);
    setBusy("");
    if (!error) setRows((rs) => rs.filter((r) => r.id !== id));
  }

  if (rows.length === 0) {
    return (
      <div className="card p-6 text-center" style={{ color: "var(--muted)" }}>
        لا توجد طلبات ترقية معلّقة.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div
          key={r.id}
          className="card p-3 flex items-center justify-between gap-3 flex-wrap"
        >
          <div>
            <div className="font-bold">{r.full_name || "وسيط"}</div>
            <div
              className="text-xs"
              style={{ color: "var(--muted)", direction: "ltr", textAlign: "right" }}
            >
              {r.email} · {r.billing === "yearly" ? "سنوي" : "شهري"}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => approve(r.id)}
              className="btn btn-primary !py-1.5 !px-3 text-sm"
              disabled={busy === r.id}
            >
              {busy === r.id ? "..." : "اعتماد وترقية"}
            </button>
            <button
              onClick={() => reject(r.id)}
              className="btn btn-ghost !py-1.5 !px-3 text-sm"
              style={{ color: "var(--danger)" }}
              disabled={busy === r.id}
            >
              رفض
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
