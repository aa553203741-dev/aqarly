"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CITIES,
  DEAL_TYPES,
  LISTING_STATUSES,
  PROPERTY_TYPES,
  labelOf,
} from "@/lib/constants";
import type { Listing } from "@/lib/types";

export function ListingsManager({
  initial,
  userId,
}: {
  initial: Listing[];
  userId: string;
}) {
  const [listings, setListings] = useState(initial);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSaving(true);
    const supabase = createClient();
    const payload = {
      broker_user_id: userId,
      title: (fd.get("title") as string).trim(),
      deal_type: fd.get("deal_type") as string,
      property_type: fd.get("property_type") as string,
      city: fd.get("city") as string,
      district: ((fd.get("district") as string) || "").trim(),
      price: fd.get("price") ? Number(fd.get("price")) : null,
      area: fd.get("area") ? Number(fd.get("area")) : null,
      bedrooms: fd.get("bedrooms") ? Number(fd.get("bedrooms")) : null,
      notes: ((fd.get("notes") as string) || "").trim(),
      status: "active" as const,
    };
    const { data, error } = await supabase
      .from("listings")
      .insert(payload)
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setListings((l) => [data as Listing, ...l]);
      form.reset();
      setOpen(false);
    }
  }

  async function toggleStatus(l: Listing) {
    const status = l.status === "active" ? "closed" : "active";
    setListings((ls) => ls.map((x) => (x.id === l.id ? { ...x, status } : x)));
    const supabase = createClient();
    await supabase.from("listings").update({ status }).eq("id", l.id);
  }

  async function remove(id: string) {
    setListings((ls) => ls.filter((x) => x.id !== id));
    const supabase = createClient();
    await supabase.from("listings").delete().eq("id", id);
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-primary mb-4"
      >
        {open ? "إغلاق" : "＋ إضافة عرض"}
      </button>

      {open && (
        <form onSubmit={add} className="card p-5 mb-5 flex flex-col gap-4">
          <div>
            <label className="label">عنوان العرض *</label>
            <input name="title" className="field" required placeholder="فيلا للبيع بحي الياسمين" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">نوع الطلب *</label>
              <select name="deal_type" className="field" defaultValue="buy">
                {DEAL_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">نوع العقار *</label>
              <select name="property_type" className="field" defaultValue="villa">
                {PROPERTY_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">المدينة *</label>
              <select name="city" className="field" defaultValue={CITIES[0]}>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">الحي</label>
              <input name="district" className="field" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">السعر (ر.س)</label>
              <input name="price" type="number" min="0" className="field" />
            </div>
            <div>
              <label className="label">المساحة (م²)</label>
              <input name="area" type="number" min="0" className="field" />
            </div>
            <div>
              <label className="label">الغرف</label>
              <input name="bedrooms" type="number" min="0" className="field" />
            </div>
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <textarea name="notes" rows={2} className="field" />
          </div>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "..." : "حفظ العرض"}
          </button>
        </form>
      )}

      {listings.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد عروض بعد.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((l) => (
            <div key={l.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="font-bold text-base">{l.title}</div>
                <span
                  className="badge"
                  style={{
                    background:
                      l.status === "active" ? "#dcfce7" : "#f1f5f9",
                    color: l.status === "active" ? "#166534" : "#475569",
                  }}
                >
                  {labelOf(LISTING_STATUSES, l.status)}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap mt-3 text-sm">
                <Tag>{labelOf(DEAL_TYPES, l.deal_type)}</Tag>
                <Tag>{labelOf(PROPERTY_TYPES, l.property_type)}</Tag>
                <Tag>{l.city}{l.district ? ` — ${l.district}` : ""}</Tag>
                {l.price != null && <Tag>{Number(l.price).toLocaleString("en-US")} ر.س</Tag>}
                {l.area != null && <Tag>{l.area} م²</Tag>}
                {l.bedrooms != null && <Tag>{l.bedrooms} غرف</Tag>}
              </div>
              {l.notes && (
                <p className="text-sm mt-2 mb-0" style={{ color: "var(--muted)" }}>
                  {l.notes}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => toggleStatus(l)}
                  className="btn btn-ghost !py-1.5 !px-3 text-sm"
                >
                  {l.status === "active" ? "إغلاق العرض" : "إعادة تفعيل"}
                </button>
                <button
                  onClick={() => remove(l.id)}
                  className="btn btn-ghost !py-1.5 !px-3 text-sm"
                  style={{ color: "var(--danger)" }}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="badge"
      style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
    >
      {children}
    </span>
  );
}
