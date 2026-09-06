"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type TeamMember = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  can_reserve: boolean;
  can_process_payments: boolean;
  can_close_deals: boolean;
  can_manage_inventory: boolean;
  can_view_all_commissions: boolean;
};

const ROLES = [
  { value: "marketer", label: "مسوّق" },
  { value: "staff", label: "موظف" },
  { value: "viewer", label: "مشاهد" },
  { value: "admin", label: "أدمن" },
];

const PERMS = [
  { key: "can_reserve", label: "الحجز" },
  { key: "can_process_payments", label: "متابعة الدفع" },
  { key: "can_close_deals", label: "إقفال الصفقات" },
  { key: "can_manage_inventory", label: "إدارة المخزون" },
  { key: "can_view_all_commissions", label: "كل العمولات" },
] as const;

export function TeamManager({
  initial,
  meId,
}: {
  initial: TeamMember[];
  meId: string;
}) {
  const [members, setMembers] = useState(initial);
  const [q, setQ] = useState("");

  async function setRole(id: string, role: string) {
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, role } : x)));
    const supabase = createClient();
    await supabase.from("profiles").update({ role }).eq("id", id);
  }

  async function togglePerm(
    id: string,
    key: (typeof PERMS)[number]["key"],
    value: boolean,
  ) {
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
    const supabase = createClient();
    await supabase
      .from("user_permissions")
      .upsert({ user_id: id, [key]: value }, { onConflict: "user_id" });
  }

  const shown = members.filter(
    (m) =>
      !q ||
      (m.full_name ?? "").includes(q) ||
      (m.email ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <input
        className="field mb-4"
        placeholder="بحث بالاسم أو البريد…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="flex flex-col gap-3">
        {shown.map((m) => {
          const isAdmin = m.role === "admin";
          const isMe = m.id === meId;
          return (
            <div key={m.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-bold">
                    {m.full_name || "—"}
                    {isMe && (
                      <span className="text-xs mr-1" style={{ color: "var(--muted)" }}>
                        {" "}
                        (أنت)
                      </span>
                    )}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--muted)", direction: "ltr", textAlign: "right" }}
                  >
                    {m.email}
                  </div>
                </div>
                <div>
                  <label className="label !mb-1 text-xs">الدور</label>
                  <select
                    className="field !py-1.5 !px-2 text-sm"
                    value={m.role === "broker" ? "marketer" : m.role}
                    onChange={(e) => setRole(m.id, e.target.value)}
                    disabled={isMe}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {PERMS.map((p) => {
                  const on = isAdmin || (m[p.key] as boolean);
                  return (
                    <button
                      key={p.key}
                      onClick={() => !isAdmin && togglePerm(m.id, p.key, !m[p.key])}
                      disabled={isAdmin}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{
                        background: on ? "var(--brand)" : "var(--surface)",
                        color: on ? "#fff" : "var(--muted)",
                        border: "1px solid var(--border)",
                        opacity: isAdmin ? 0.7 : 1,
                        cursor: isAdmin ? "default" : "pointer",
                      }}
                    >
                      {on ? "✓ " : ""}
                      {p.label}
                    </button>
                  );
                })}
              </div>
              {isAdmin && (
                <div className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                  الأدمن يملك كل الصلاحيات.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
