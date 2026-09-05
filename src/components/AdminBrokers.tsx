"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Plan, Profile } from "@/lib/types";

export function AdminBrokers({ initial }: { initial: Profile[] }) {
  const [brokers, setBrokers] = useState(initial);
  const [q, setQ] = useState("");

  async function setPlan(id: string, plan: Plan) {
    setBrokers((bs) => bs.map((b) => (b.id === id ? { ...b, plan } : b)));
    const supabase = createClient();
    await supabase.from("profiles").update({ plan }).eq("id", id);
  }

  const shown = brokers.filter(
    (b) =>
      !q ||
      (b.full_name ?? "").includes(q) ||
      (b.email ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <input
        className="field mb-4"
        placeholder="بحث بالاسم أو البريد…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="flex flex-col gap-2">
        {shown.map((b) => (
          <div
            key={b.id}
            className="card p-3 flex items-center justify-between gap-3 flex-wrap"
          >
            <div>
              <div className="font-bold">{b.full_name || "—"}</div>
              <div
                className="text-xs"
                style={{ color: "var(--muted)", direction: "ltr", textAlign: "right" }}
              >
                {b.email}
                {b.role === "admin" && " · أدمن"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="badge"
                style={{
                  background: b.plan === "premium" ? "var(--gold)" : "var(--brand-soft)",
                  color: b.plan === "premium" ? "#fff" : "var(--brand-dark)",
                }}
              >
                {b.plan === "premium" ? "مميّز" : "مجاني"}
              </span>
              <button
                onClick={() =>
                  setPlan(b.id, b.plan === "premium" ? "free" : "premium")
                }
                className="btn btn-ghost !py-1.5 !px-3 text-sm"
              >
                {b.plan === "premium" ? "تحويل لمجاني" : "ترقية لمميّز"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
