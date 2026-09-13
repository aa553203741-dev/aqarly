"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PendingAccount = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
};

function when(iso: string) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function PendingAccounts({ initial }: { initial: PendingAccount[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decide(id: string, approve: boolean) {
    if (!approve) {
      const ok = window.confirm(
        "رفض هذا الحساب؟ سيفقد الوصول ويُسحب كود الوسيط الخاص به.",
      );
      if (!ok) return;
    }
    setBusy(id);
    setError("");
    const supabase = createClient();
    const { data, error: rpcError } = approve
      ? await supabase.rpc("approve_user", { p_user: id })
      : await supabase.rpc("reject_user", {
          p_user: id,
          p_reason: "تسجيل ذاتي غير مصرّح",
        });
    setBusy(null);

    if (rpcError || (data && data !== "ok")) {
      setError(
        rpcError?.message === "forbidden" || data === "self"
          ? "لا تملك صلاحية هذا الإجراء"
          : "تعذّر تنفيذ الإجراء، حاول مجددًا",
      );
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        لا توجد حسابات بانتظار الاعتماد.
      </p>
    );
  }

  return (
    <div>
      <div
        className="card p-3 mb-3 text-sm"
        style={{
          borderColor: "var(--warn, #d97706)",
          background: "color-mix(in srgb, var(--warn, #d97706) 8%, transparent)",
        }}
      >
        <b>{rows.length}</b> حساب سجّل ذاتيًا وينتظر قرارك. لا يرى أيٌّ منها
        مخزونك أو عملاءك قبل الاعتماد.
      </div>

      {error && (
        <p className="text-sm mb-3" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="card p-3 flex flex-wrap items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm">
                {r.full_name || "بلا اسم"}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--muted)", direction: "ltr", textAlign: "right" }}
              >
                {r.email}
                {r.phone ? ` · ${r.phone}` : ""}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                سجّل في {when(r.created_at)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-ghost text-sm"
                disabled={busy === r.id}
                onClick={() => decide(r.id, false)}
              >
                رفض
              </button>
              <button
                className="btn btn-primary text-sm"
                disabled={busy === r.id}
                onClick={() => decide(r.id, true)}
              >
                {busy === r.id ? "..." : "اعتماد"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
