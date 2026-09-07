"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/inventory-types";

export function ClientsManager({ initial }: { initial: Client[] }) {
  const [clients, setClients] = useState(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", budget: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("clients")
      .insert({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        budget: form.budget ? Number(form.budget) : null,
        notes: form.notes.trim(),
      })
      .select()
      .single();
    setSaving(false);
    if (data) {
      setClients((c) => [data as Client, ...c]);
      setForm({ name: "", phone: "", budget: "", notes: "" });
      setOpen(false);
    }
  }

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="btn btn-primary mb-4">
        {open ? "إغلاق" : "＋ إضافة عميل"}
      </button>

      {open && (
        <form onSubmit={add} className="card p-5 mb-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">اسم العميل *</label>
              <input
                className="field"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">الجوال</label>
              <input
                className="field"
                style={{ direction: "ltr", textAlign: "right" }}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">الميزانية (ر.س)</label>
              <input
                className="field"
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <textarea
              className="field"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "..." : "حفظ"}
          </button>
        </form>
      )}

      {clients.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا عملاء بعد. أضِف عميلًا لتربط به الوحدات المناسبة.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/clients/${c.id}`}
              className="card p-4 no-underline"
              style={{ color: "var(--text)" }}
            >
              <div className="font-bold text-base">{c.name}</div>
              <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                {c.phone && <span style={{ direction: "ltr" }}>{c.phone}</span>}
                {c.budget != null && (
                  <span> · ميزانية {Number(c.budget).toLocaleString("en-US")} ر.س</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
