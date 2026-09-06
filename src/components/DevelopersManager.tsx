"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Developer } from "@/lib/inventory-types";

const EMPTY = {
  name: "",
  phone: "",
  sales_rep_name: "",
  sales_rep_phone: "",
  website: "",
  logo_url: "",
  notes: "",
};

export function DevelopersManager({
  initial,
  canManage,
}: {
  initial: Developer[];
  canManage: boolean;
}) {
  const [devs, setDevs] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Developer | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  function startAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setOpen(true);
  }
  function startEdit(d: Developer) {
    setEditing(d);
    setForm({
      name: d.name,
      phone: d.phone ?? "",
      sales_rep_name: d.sales_rep_name ?? "",
      sales_rep_phone: d.sales_rep_phone ?? "",
      website: d.website ?? "",
      logo_url: d.logo_url ?? "",
      notes: d.notes ?? "",
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      sales_rep_name: form.sales_rep_name.trim() || null,
      sales_rep_phone: form.sales_rep_phone.trim() || null,
      website: form.website.trim() || null,
      logo_url: form.logo_url.trim() || null,
      notes: form.notes.trim(),
    };
    if (editing) {
      const { data } = await supabase
        .from("developers")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      if (data) setDevs((l) => l.map((x) => (x.id === editing.id ? (data as Developer) : x)));
    } else {
      const { data } = await supabase
        .from("developers")
        .insert(payload)
        .select()
        .single();
      if (data) setDevs((l) => [...l, data as Developer].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setSaving(false);
    setOpen(false);
  }

  async function remove(id: string) {
    if (!confirm("حذف المطوّر؟")) return;
    setDevs((l) => l.filter((x) => x.id !== id));
    const supabase = createClient();
    await supabase.from("developers").delete().eq("id", id);
  }

  return (
    <div>
      {canManage && (
        <button onClick={startAdd} className="btn btn-primary mb-4">
          ＋ إضافة مطوّر
        </button>
      )}

      {open && canManage && (
        <form onSubmit={save} className="card p-5 mb-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">اسم المطوّر *</label>
              <input
                className="field"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رقم التواصل</label>
              <input
                className="field"
                style={{ direction: "ltr", textAlign: "right" }}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">اسم مسؤول المبيعات</label>
              <input
                className="field"
                value={form.sales_rep_name}
                onChange={(e) => setForm({ ...form, sales_rep_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">جوال مسؤول المبيعات</label>
              <input
                className="field"
                style={{ direction: "ltr", textAlign: "right" }}
                value={form.sales_rep_phone}
                onChange={(e) => setForm({ ...form, sales_rep_phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">الموقع الإلكتروني</label>
              <input
                className="field"
                style={{ direction: "ltr", textAlign: "right" }}
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رابط الشعار</label>
              <input
                className="field"
                style={{ direction: "ltr", textAlign: "right" }}
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
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
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "..." : editing ? "حفظ التعديل" : "إضافة"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              إلغاء
            </button>
          </div>
        </form>
      )}

      {devs.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا يوجد مطوّرون بعد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {devs.map((d) => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-base">{d.name}</div>
                {canManage && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(d)}
                      className="btn btn-ghost !py-1 !px-2 text-xs"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => remove(d.id)}
                      className="btn btn-ghost !py-1 !px-2 text-xs"
                      style={{ color: "var(--danger)" }}
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm mt-2 flex flex-col gap-1" style={{ color: "var(--muted)" }}>
                {d.phone && <span style={{ direction: "ltr", textAlign: "right" }}>📞 {d.phone}</span>}
                {d.sales_rep_name && <span>👤 {d.sales_rep_name} — {d.sales_rep_phone}</span>}
                {d.website && <span style={{ direction: "ltr", textAlign: "right" }}>🌐 {d.website}</span>}
                {d.notes && <span>{d.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
