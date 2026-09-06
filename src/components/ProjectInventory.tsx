"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UNIT_STATUS } from "@/lib/inventory-constants";
import type { Unit, UnitModel, UnitStatus } from "@/lib/inventory-types";

function statusMeta(v: string) {
  return UNIT_STATUS.find((s) => s.value === v) ?? UNIT_STATUS[0];
}

type Draft = {
  unit_no: string;
  floor: string;
  price: string;
  status: UnitStatus;
  commission: string;
};

export function ProjectInventory({
  projectId,
  defaultCommission,
  initialModels,
  initialUnits,
  canManage,
}: {
  projectId: string;
  defaultCommission: number | null;
  initialModels: UnitModel[];
  initialUnits: Unit[];
  canManage: boolean;
}) {
  const [tab, setTab] = useState<"models" | "units">("models");
  const [models, setModels] = useState(initialModels);
  const [units, setUnits] = useState(initialUnits);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <TabBtn active={tab === "models"} onClick={() => setTab("models")}>
          النماذج ({models.length})
        </TabBtn>
        <TabBtn active={tab === "units"} onClick={() => setTab("units")}>
          الوحدات ({units.length})
        </TabBtn>
      </div>

      {tab === "models" ? (
        <ModelsSection
          projectId={projectId}
          models={models}
          setModels={setModels}
          canManage={canManage}
        />
      ) : (
        <UnitsSection
          projectId={projectId}
          defaultCommission={defaultCommission}
          models={models}
          units={units}
          setUnits={setUnits}
          canManage={canManage}
        />
      )}
    </div>
  );
}

/* ---------------- النماذج ---------------- */
function ModelsSection({
  projectId,
  models,
  setModels,
  canManage,
}: {
  projectId: string;
  models: UnitModel[];
  setModels: React.Dispatch<React.SetStateAction<UnitModel[]>>;
  canManage: boolean;
}) {
  const EMPTY = {
    name: "",
    bedrooms: "",
    area: "",
    bathrooms: "",
    majlis: false,
    hall: false,
    kitchen: true,
    maid_room: false,
    balcony: false,
    floor_plan_url: "",
    notes: "",
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("unit_models")
      .insert({
        project_id: projectId,
        name: form.name.trim(),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        area: form.area ? Number(form.area) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        majlis: form.majlis,
        hall: form.hall,
        kitchen: form.kitchen,
        maid_room: form.maid_room,
        balcony: form.balcony,
        floor_plan_url: form.floor_plan_url.trim() || null,
        notes: form.notes.trim(),
      })
      .select()
      .single();
    setSaving(false);
    if (data) {
      setModels((l) => [...l, data as UnitModel]);
      setForm({ ...EMPTY });
      setOpen(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("حذف النموذج؟ (الوحدات المرتبطة تبقى بلا نموذج)")) return;
    setModels((l) => l.filter((x) => x.id !== id));
    const supabase = createClient();
    await supabase.from("unit_models").delete().eq("id", id);
  }

  const chips = (m: UnitModel) =>
    [
      m.majlis && "مجلس",
      m.hall && "صالة",
      m.kitchen && "مطبخ",
      m.maid_room && "غرفة خادمة",
      m.balcony && "بلكونة",
    ].filter(Boolean) as string[];

  return (
    <div>
      {canManage && (
        <button onClick={() => setOpen((o) => !o)} className="btn btn-primary mb-4">
          {open ? "إغلاق" : "＋ إضافة نموذج"}
        </button>
      )}

      {open && canManage && (
        <form onSubmit={save} className="card p-5 mb-5 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="label">اسم النموذج *</label>
              <input
                className="field"
                required
                placeholder="A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">الغرف</label>
              <input
                className="field"
                type="number"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              />
            </div>
            <div>
              <label className="label">المساحة م²</label>
              <input
                className="field"
                type="number"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
            </div>
            <div>
              <label className="label">دورات المياه</label>
              <input
                className="field"
                type="number"
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-4 flex-wrap text-sm">
            {(
              [
                ["majlis", "مجلس"],
                ["hall", "صالة"],
                ["kitchen", "مطبخ"],
                ["maid_room", "غرفة خادمة"],
                ["balcony", "بلكونة"],
              ] as const
            ).map(([k, lbl]) => (
              <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[k] as boolean}
                  onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
                />
                {lbl}
              </label>
            ))}
          </div>
          <div>
            <label className="label">رابط مخطط الشقة</label>
            <input
              className="field"
              style={{ direction: "ltr", textAlign: "right" }}
              value={form.floor_plan_url}
              onChange={(e) => setForm({ ...form, floor_plan_url: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "..." : "حفظ النموذج"}
          </button>
        </form>
      )}

      {models.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد نماذج بعد. أضِف نموذجًا ثم أنشئ وحداته.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {models.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="font-bold">نموذج {m.name}</div>
                {canManage && (
                  <button
                    onClick={() => remove(m.id)}
                    className="btn btn-ghost !py-1 !px-2 text-xs"
                    style={{ color: "var(--danger)" }}
                  >
                    حذف
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap mt-2 text-sm">
                {m.bedrooms != null && <Tag>{m.bedrooms} غرف</Tag>}
                {m.area != null && <Tag>{m.area} م²</Tag>}
                {m.bathrooms != null && <Tag>{m.bathrooms} دورات</Tag>}
              </div>
              {chips(m).length > 0 && (
                <div className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                  {chips(m).join(" · ")}
                </div>
              )}
              {m.floor_plan_url && (
                <a
                  href={m.floor_plan_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm mt-2 inline-block"
                  style={{ color: "var(--brand)" }}
                >
                  📐 المخطط
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- الوحدات ---------------- */
function UnitsSection({
  projectId,
  defaultCommission,
  models,
  units,
  setUnits,
  canManage,
}: {
  projectId: string;
  defaultCommission: number | null;
  models: UnitModel[];
  units: Unit[];
  setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  canManage: boolean;
}) {
  const [mode, setMode] = useState<"" | "generate" | "import">("");
  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [saving, setSaving] = useState(false);
  // مولّد سريع
  const [gen, setGen] = useState({ floorStart: "1", floors: "4", perFloor: "4", price: "", commission: "" });
  // استيراد
  const [csv, setCsv] = useState("");

  const modelName = (id: string | null) =>
    models.find((m) => m.id === id)?.name ?? "—";

  function runGenerate() {
    const fs = Number(gen.floorStart) || 1;
    const fc = Number(gen.floors) || 1;
    const pf = Number(gen.perFloor) || 1;
    const rows: Draft[] = [];
    for (let f = fs; f < fs + fc; f++) {
      for (let u = 1; u <= pf; u++) {
        rows.push({
          unit_no: `${f}${String(u).padStart(2, "0")}`,
          floor: String(f),
          price: gen.price,
          status: "available",
          commission: gen.commission || (defaultCommission?.toString() ?? ""),
        });
      }
    }
    setDrafts(rows);
  }

  function runImport() {
    const rows: Draft[] = [];
    for (const line of csv.split(/\r?\n/)) {
      const t = line.trim();
      if (!t) continue;
      const [unit_no, floor, price, status] = t.split(",").map((x) => x.trim());
      if (!unit_no || unit_no === "unit_no") continue;
      rows.push({
        unit_no,
        floor: floor || "",
        price: price || "",
        status: (["available", "reserved", "sold", "unavailable"].includes(status)
          ? status
          : "available") as UnitStatus,
        commission: defaultCommission?.toString() ?? "",
      });
    }
    setDrafts(rows);
  }

  function updateDraft(i: number, patch: Partial<Draft>) {
    setDrafts((d) => d.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function saveDrafts() {
    if (!modelId) {
      alert("اختر النموذج أولًا");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = drafts.map((d) => ({
      project_id: projectId,
      model_id: modelId,
      unit_no: d.unit_no.trim(),
      floor: d.floor ? Number(d.floor) : null,
      price: d.price ? Number(d.price) : null,
      status: d.status,
      commission_amount: d.commission ? Number(d.commission) : null,
    }));
    const { data } = await supabase.from("units").insert(payload).select();
    setSaving(false);
    if (data) {
      setUnits((l) => [...(data as Unit[]), ...l].sort((a, b) => a.unit_no.localeCompare(b.unit_no)));
      setDrafts([]);
      setMode("");
    }
  }

  async function setStatus(id: string, status: UnitStatus) {
    setUnits((l) => l.map((u) => (u.id === id ? { ...u, status } : u)));
    const supabase = createClient();
    await supabase.from("units").update({ status }).eq("id", id);
  }

  async function setPrice(id: string, price: number | null) {
    setUnits((l) => l.map((u) => (u.id === id ? { ...u, price } : u)));
    const supabase = createClient();
    await supabase.from("units").update({ price }).eq("id", id);
  }

  async function remove(id: string) {
    setUnits((l) => l.filter((u) => u.id !== id));
    const supabase = createClient();
    await supabase.from("units").delete().eq("id", id);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Unit[]>();
    for (const u of units) {
      const k = u.model_id ?? "none";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(u);
    }
    return map;
  }, [units]);

  return (
    <div>
      {canManage && models.length === 0 && (
        <div className="card p-5 mb-4 text-sm" style={{ color: "var(--muted)" }}>
          أضِف نموذجًا واحدًا على الأقل من تبويب «النماذج» قبل إنشاء الوحدات.
        </div>
      )}

      {canManage && models.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setMode(mode === "generate" ? "" : "generate")}
            className="btn btn-primary text-sm"
          >
            ⚡ توليد سريع
          </button>
          <button
            onClick={() => setMode(mode === "import" ? "" : "import")}
            className="btn btn-ghost text-sm"
          >
            ⬆ استيراد CSV
          </button>
        </div>
      )}

      {mode && canManage && (
        <div className="card p-5 mb-5 flex flex-col gap-4">
          <div>
            <label className="label">النموذج</label>
            <select
              className="field !w-auto"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  نموذج {m.name}
                </option>
              ))}
            </select>
          </div>

          {mode === "generate" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="label">أول دور</label>
                  <input className="field" type="number" value={gen.floorStart}
                    onChange={(e) => setGen({ ...gen, floorStart: e.target.value })} />
                </div>
                <div>
                  <label className="label">عدد الأدوار</label>
                  <input className="field" type="number" value={gen.floors}
                    onChange={(e) => setGen({ ...gen, floors: e.target.value })} />
                </div>
                <div>
                  <label className="label">وحدات/دور</label>
                  <input className="field" type="number" value={gen.perFloor}
                    onChange={(e) => setGen({ ...gen, perFloor: e.target.value })} />
                </div>
                <div>
                  <label className="label">السعر</label>
                  <input className="field" type="number" value={gen.price}
                    onChange={(e) => setGen({ ...gen, price: e.target.value })} />
                </div>
                <div>
                  <label className="label">العمولة</label>
                  <input className="field" type="number" value={gen.commission}
                    onChange={(e) => setGen({ ...gen, commission: e.target.value })} />
                </div>
              </div>
              <button type="button" onClick={runGenerate} className="btn btn-ghost text-sm self-start">
                توليد الصفوف
              </button>
            </>
          )}

          {mode === "import" && (
            <div>
              <label className="label">
                الصق الأعمدة: unit_no,floor,price,status (سطر لكل وحدة)
              </label>
              <textarea
                className="field"
                rows={5}
                style={{ direction: "ltr", textAlign: "left", fontFamily: "monospace" }}
                placeholder={"101,1,650000,available\n102,1,655000,available"}
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
              />
              <button type="button" onClick={runImport} className="btn btn-ghost text-sm mt-2">
                تحليل الصفوف
              </button>
            </div>
          )}

          {drafts.length > 0 && (
            <div>
              <div className="text-sm font-bold mb-2">{drafts.length} وحدة — عدّل ثم احفظ:</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "var(--muted)" }}>
                      <th className="text-right p-1">رقم</th>
                      <th className="text-right p-1">دور</th>
                      <th className="text-right p-1">السعر</th>
                      <th className="text-right p-1">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((d, i) => (
                      <tr key={i}>
                        <td className="p-1">
                          <input className="field !py-1 !px-2 w-20" value={d.unit_no}
                            onChange={(e) => updateDraft(i, { unit_no: e.target.value })} />
                        </td>
                        <td className="p-1">
                          <input className="field !py-1 !px-2 w-14" value={d.floor}
                            onChange={(e) => updateDraft(i, { floor: e.target.value })} />
                        </td>
                        <td className="p-1">
                          <input className="field !py-1 !px-2 w-28" value={d.price}
                            onChange={(e) => updateDraft(i, { price: e.target.value })} />
                        </td>
                        <td className="p-1">
                          <select className="field !py-1 !px-2" value={d.status}
                            onChange={(e) => updateDraft(i, { status: e.target.value as UnitStatus })}>
                            {UNIT_STATUS.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={saveDrafts} className="btn btn-primary mt-3" disabled={saving}>
                {saving ? "..." : `حفظ ${drafts.length} وحدة`}
              </button>
            </div>
          )}
        </div>
      )}

      {units.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد وحدات بعد.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[...grouped.entries()].map(([mid, list]) => (
            <div key={mid} className="card p-4">
              <div className="font-bold mb-3">
                نموذج {modelName(mid === "none" ? null : mid)} —{" "}
                <span style={{ color: "var(--muted)" }}>{list.length} وحدة</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    {list.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="p-2 font-bold">{u.unit_no}</td>
                        <td className="p-2" style={{ color: "var(--muted)" }}>
                          دور {u.floor ?? "—"}
                        </td>
                        <td className="p-2">
                          {canManage ? (
                            <select
                              className="field !py-1 !px-2 text-xs"
                              value={u.status}
                              onChange={(e) => setStatus(u.id, e.target.value as UnitStatus)}
                            >
                              {UNIT_STATUS.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="badge" style={{ background: statusMeta(u.status).color, color: "#fff" }}>
                              {statusMeta(u.status).label}
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          {canManage ? (
                            <input
                              className="field !py-1 !px-2 w-28 text-xs"
                              defaultValue={u.price ?? ""}
                              onBlur={(e) =>
                                setPrice(u.id, e.target.value ? Number(e.target.value) : null)
                              }
                            />
                          ) : u.price != null ? (
                            `${Number(u.price).toLocaleString("en-US")} ر.س`
                          ) : (
                            "—"
                          )}
                        </td>
                        {canManage && (
                          <td className="p-2">
                            <button
                              onClick={() => remove(u.id)}
                              className="text-xs"
                              style={{ color: "var(--danger)" }}
                            >
                              حذف
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- عناصر مساعدة ---------------- */
function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-sm font-bold"
      style={{
        background: active ? "var(--brand)" : "var(--surface)",
        color: active ? "#fff" : "var(--muted)",
        border: "1px solid var(--border)",
      }}
    >
      {children}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
      {children}
    </span>
  );
}
