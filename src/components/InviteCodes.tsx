"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Invite = {
  id: string;
  code: string;
  role: string;
  note: string;
  active: boolean;
  used_by: string | null;
  created_at: string;
};

const ROLE_LABEL: Record<string, string> = {
  marketer: "مسوّق",
  staff: "موظف",
  viewer: "مشاهد",
};

export function InviteCodes({ initial }: { initial: Invite[] }) {
  const [codes, setCodes] = useState(initial);
  const [role, setRole] = useState("marketer");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  async function generate() {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("gen_invite", {
      p_role: role,
      p_note: note.trim(),
    });
    setBusy(false);
    if (!error && data) {
      setCodes((c) => [
        {
          id: crypto.randomUUID(),
          code: data as string,
          role,
          note: note.trim(),
          active: true,
          used_by: null,
          created_at: new Date().toISOString(),
        },
        ...c,
      ]);
      setNote("");
    }
  }

  async function copyLink(code: string) {
    const link = `${window.location.origin}/signup?invite=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(code);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* منع النسخ */
    }
  }

  async function revoke(id: string) {
    setCodes((c) => c.map((x) => (x.id === id ? { ...x, active: false } : x)));
    const supabase = createClient();
    await supabase.from("invite_codes").update({ active: false }).eq("id", id);
  }

  return (
    <div>
      <div className="card p-4 mb-4">
        <div className="flex gap-2 flex-wrap items-end">
          <div>
            <label className="label !mb-1 text-xs">الدور</label>
            <select className="field !py-1.5" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="marketer">مسوّق</option>
              <option value="staff">موظف</option>
              <option value="viewer">مشاهد</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="label !mb-1 text-xs">ملاحظة (اختياري)</label>
            <input
              className="field !py-1.5"
              placeholder="مثال: مسوّق جدة"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button onClick={generate} className="btn btn-primary text-sm" disabled={busy}>
            {busy ? "..." : "توليد كود"}
          </button>
        </div>
      </div>

      {codes.length === 0 ? (
        <div className="card p-6 text-center" style={{ color: "var(--muted)" }}>
          لا أكواد بعد. ولّد كودًا وأرسله للمسوّق.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {codes.map((c) => {
            const used = !!c.used_by;
            return (
              <div key={c.id} className="card p-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <span
                    className="font-extrabold tracking-[2px]"
                    style={{ color: "var(--brand)", direction: "ltr" }}
                  >
                    {c.code}
                  </span>
                  <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
                    {ROLE_LABEL[c.role]}
                  </span>
                  {c.note && (
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {c.note}
                    </span>
                  )}
                  <span
                    className="badge"
                    style={{
                      background: used ? "#f1f5f9" : c.active ? "#dcfce7" : "#fde8e8",
                      color: used ? "#475569" : c.active ? "#166534" : "#991b1b",
                    }}
                  >
                    {used ? "مُستخدم" : c.active ? "متاح" : "ملغى"}
                  </span>
                </div>
                {!used && c.active && (
                  <div className="flex gap-2">
                    <button onClick={() => copyLink(c.code)} className="btn btn-ghost !py-1 !px-3 text-xs">
                      {copied === c.code ? "✓ نُسخ" : "نسخ رابط الدعوة"}
                    </button>
                    <button
                      onClick={() => revoke(c.id)}
                      className="btn btn-ghost !py-1 !px-3 text-xs"
                      style={{ color: "var(--danger)" }}
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
