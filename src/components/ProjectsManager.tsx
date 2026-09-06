"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CITIES } from "@/lib/constants";
import { PROJECT_STATUS } from "@/lib/inventory-constants";
import { ImageUploader } from "@/components/ImageUploader";
import type { Developer, District, Project } from "@/lib/inventory-types";

function statusMeta(v: string) {
  return PROJECT_STATUS.find((s) => s.value === v) ?? PROJECT_STATUS[2];
}

const EMPTY = {
  name: "",
  developer_id: "",
  status: "off_plan",
  description: "",
  cover_image: "",
  maps_url: "",
  lat: "",
  lng: "",
  default_commission_amount: "",
  city: CITIES[0] as string,
  zone: "",
  district_name: "",
};

export function ProjectsManager({
  initial,
  developers,
  districts,
  canManage,
}: {
  initial: Project[];
  developers: Developer[];
  districts: District[];
  canManage: boolean;
}) {
  const [projects, setProjects] = useState(initial);
  const [distList, setDistList] = useState(districts);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // إيجاد أو إنشاء الحي، وإرجاع معرّفه
  async function ensureDistrict(
    supabase: ReturnType<typeof createClient>,
  ): Promise<string | null> {
    const city = form.city.trim();
    const zone = form.zone.trim();
    const name = form.district_name.trim();
    if (!name) return null;
    const found = distList.find(
      (d) => d.city === city && d.zone === zone && d.name === name,
    );
    if (found) return found.id;
    const { data } = await supabase
      .from("districts")
      .insert({ city, zone, name })
      .select()
      .single();
    if (data) {
      setDistList((l) => [...l, data as District]);
      return (data as District).id;
    }
    return null;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const district_id = await ensureDistrict(supabase);
    const payload = {
      name: form.name.trim(),
      developer_id: form.developer_id || null,
      district_id,
      status: form.status,
      description: form.description.trim(),
      cover_image: form.cover_image.trim() || null,
      maps_url: form.maps_url.trim() || null,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      default_commission_amount: form.default_commission_amount
        ? Number(form.default_commission_amount)
        : null,
    };
    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select("*, developer:developers(name), district:districts(city, zone, name)")
      .single();
    setSaving(false);
    if (error) {
      setError("تعذّر الحفظ: " + error.message);
      return;
    }
    if (data) setProjects((l) => [data as Project, ...l]);
    setForm({ ...EMPTY });
    setOpen(false);
  }

  async function remove(id: string) {
    if (!confirm("حذف المشروع وكل نماذجه ووحداته؟")) return;
    setProjects((l) => l.filter((x) => x.id !== id));
    const supabase = createClient();
    await supabase.from("projects").delete().eq("id", id);
  }

  return (
    <div>
      {canManage && (
        <button onClick={() => setOpen((o) => !o)} className="btn btn-primary mb-4">
          {open ? "إغلاق" : "＋ إضافة مشروع"}
        </button>
      )}

      {open && canManage && (
        <form onSubmit={save} className="card p-5 mb-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">اسم المشروع *</label>
              <input
                className="field"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">المطوّر</label>
              <select
                className="field"
                value={form.developer_id}
                onChange={(e) => setForm({ ...form, developer_id: e.target.value })}
              >
                <option value="">— اختر —</option>
                {developers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">المدينة</label>
              <select
                className="field"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">المنطقة</label>
              <input
                className="field"
                placeholder="شمال جدة"
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">الحي *</label>
              <input
                className="field"
                required
                placeholder="النزهة"
                list="districts-list"
                value={form.district_name}
                onChange={(e) => setForm({ ...form, district_name: e.target.value })}
              />
              <datalist id="districts-list">
                {distList.map((d) => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">حالة المشروع</label>
              <select
                className="field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {PROJECT_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">عمولة افتراضية للوحدة (ر.س)</label>
              <input
                className="field"
                type="number"
                min="0"
                value={form.default_commission_amount}
                onChange={(e) =>
                  setForm({ ...form, default_commission_amount: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Latitude</label>
              <input
                className="field"
                style={{ direction: "ltr", textAlign: "right" }}
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input
                className="field"
                style={{ direction: "ltr", textAlign: "right" }}
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رابط Google Maps</label>
              <input
                className="field"
                style={{ direction: "ltr", textAlign: "right" }}
                value={form.maps_url}
                onChange={(e) => setForm({ ...form, maps_url: e.target.value })}
              />
            </div>
          </div>

          <ImageUploader
            label="صورة الغلاف"
            value={form.cover_image || null}
            onUploaded={(url) => setForm({ ...form, cover_image: url })}
          />
          <div>
            <label className="label">الوصف</label>
            <textarea
              className="field"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "..." : "حفظ المشروع"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              إلغاء
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد مشاريع بعد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => {
            const s = statusMeta(p.status);
            return (
              <div key={p.id} className="card overflow-hidden">
                {p.cover_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.cover_image}
                    alt=""
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-base">{p.name}</div>
                    <span
                      className="badge"
                      style={{ background: s.color, color: "#fff" }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                    {p.developer?.name && <span>{p.developer.name} · </span>}
                    {p.district
                      ? `${p.district.city} — ${p.district.name}`
                      : "بلا حي"}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="btn btn-ghost !py-1.5 !px-3 text-sm"
                    >
                      عرض المشروع
                    </Link>
                    {p.maps_url && (
                      <a
                        href={p.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost !py-1.5 !px-3 text-sm"
                      >
                        📍 الموقع
                      </a>
                    )}
                    {canManage && (
                      <button
                        onClick={() => remove(p.id)}
                        className="btn btn-ghost !py-1.5 !px-3 text-sm"
                        style={{ color: "var(--danger)" }}
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
