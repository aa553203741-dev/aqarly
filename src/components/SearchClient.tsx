"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PROJECT_STATUS, UNIT_STATUS } from "@/lib/inventory-constants";
import { ReserveModal, type ReserveTarget } from "@/components/ReserveModal";
import { ShareButton } from "@/components/ShareButton";
import { AddToClientButton } from "@/components/AddToClientButton";
import type {
  Developer,
  District,
  UnitSearchRow,
  UnitStatus,
} from "@/lib/inventory-types";

type Filters = {
  city: string;
  districtId: string;
  developerId: string;
  bedrooms: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  projectStatus: string;
  availableOnly: boolean;
};

const EMPTY: Filters = {
  city: "",
  districtId: "",
  developerId: "",
  bedrooms: "",
  priceMin: "",
  priceMax: "",
  areaMin: "",
  areaMax: "",
  projectStatus: "",
  availableOnly: true,
};

function statusMeta(v: string) {
  return UNIT_STATUS.find((s) => s.value === v) ?? UNIT_STATUS[0];
}

export function SearchClient({
  districts,
  developers,
  canReserve,
}: {
  districts: District[];
  developers: Developer[];
  canReserve: boolean;
}) {
  const [f, setF] = useState<Filters>({ ...EMPTY });
  const [rows, setRows] = useState<UnitSearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UnitSearchRow[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [reserveTarget, setReserveTarget] = useState<ReserveTarget | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cities = useMemo(
    () => [...new Set(districts.map((d) => d.city))].sort(),
    [districts],
  );
  const cityDistricts = useMemo(
    () => districts.filter((d) => !f.city || d.city === f.city),
    [districts, f.city],
  );

  function set<K extends keyof Filters>(k: K, v: Filters[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function run() {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("units_search").select("*");
    if (f.availableOnly) q = q.eq("status", "available");
    if (f.city) q = q.eq("city", f.city);
    if (f.districtId) q = q.eq("district_id", f.districtId);
    if (f.developerId) q = q.eq("developer_id", f.developerId);
    if (f.projectStatus) q = q.eq("project_status", f.projectStatus);
    if (f.bedrooms) q = q.eq("bedrooms", Number(f.bedrooms));
    if (f.priceMin) q = q.gte("price", Number(f.priceMin));
    if (f.priceMax) q = q.lte("price", Number(f.priceMax));
    if (f.areaMin) q = q.gte("area", Number(f.areaMin));
    if (f.areaMax) q = q.lte("area", Number(f.areaMax));
    const { data } = await q.order("price", { ascending: true }).limit(120);
    setRows((data as UnitSearchRow[]) ?? []);
    setLoading(false);
  }

  // بحث تلقائي مؤجّل عند تغيّر الفلاتر
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(run, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);

  function toggleSelect(r: UnitSearchRow) {
    setSelected((s) => {
      if (s.find((x) => x.id === r.id)) return s.filter((x) => x.id !== r.id);
      if (s.length >= 4) return s;
      return [...s, r];
    });
  }

  return (
    <div className="pb-20">
      {/* الفلاتر */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm">الفلاتر</span>
          <div className="flex gap-2">
            <button
              onClick={() => setF({ ...EMPTY })}
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              مسح
            </button>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="text-xs sm:hidden"
              style={{ color: "var(--brand)" }}
            >
              {showFilters ? "إخفاء" : "إظهار"}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Select label="المدينة" value={f.city} onChange={(v) => { set("city", v); set("districtId", ""); }}>
                <option value="">الكل</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="الحي" value={f.districtId} onChange={(v) => set("districtId", v)}>
                <option value="">الكل</option>
                {cityDistricts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
              <Select label="المطوّر" value={f.developerId} onChange={(v) => set("developerId", v)}>
                <option value="">الكل</option>
                {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
              <Select label="حالة المشروع" value={f.projectStatus} onChange={(v) => set("projectStatus", v)}>
                <option value="">الكل</option>
                {PROJECT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>

            <div>
              <label className="label">عدد الغرف</label>
              <div className="flex gap-2 flex-wrap">
                {["", "1", "2", "3", "4", "5"].map((b) => (
                  <button
                    key={b || "any"}
                    onClick={() => set("bedrooms", b)}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold"
                    style={{
                      background: f.bedrooms === b ? "var(--brand)" : "var(--surface)",
                      color: f.bedrooms === b ? "#fff" : "var(--muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {b === "" ? "الكل" : b === "5" ? "+5" : b}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Num label="السعر من" value={f.priceMin} onChange={(v) => set("priceMin", v)} />
              <Num label="السعر إلى" value={f.priceMax} onChange={(v) => set("priceMax", v)} />
              <Num label="المساحة من" value={f.areaMin} onChange={(v) => set("areaMin", v)} />
              <Num label="المساحة إلى" value={f.areaMax} onChange={(v) => set("areaMax", v)} />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={f.availableOnly}
                onChange={(e) => set("availableOnly", e.target.checked)}
              />
              المتاح فقط
            </label>
          </div>
        )}
      </div>

      {/* النتائج */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold">
          {loading ? "جارِ البحث…" : `${rows.length} وحدة`}
        </span>
      </div>

      {rows.length === 0 && !loading ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد وحدات مطابقة. عدّل الفلاتر.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map((r) => {
            const s = statusMeta(r.status);
            const isSel = !!selected.find((x) => x.id === r.id);
            return (
              <div
                key={r.id}
                className="card p-4"
                style={{ borderColor: isSel ? "var(--brand)" : "var(--border)", borderWidth: isSel ? 2 : 1 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold">{r.project_name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {r.developer_name} · {r.city} — {r.district_name}
                    </div>
                  </div>
                  <span className="badge" style={{ background: s.color, color: "#fff" }}>
                    {s.label}
                  </span>
                </div>
                <div className="text-base font-extrabold mt-2" style={{ color: "var(--brand)" }}>
                  {r.price != null ? `${Number(r.price).toLocaleString("en-US")} ر.س` : "—"}
                </div>
                <div className="flex gap-2 flex-wrap mt-2 text-sm">
                  <Tag>وحدة {r.unit_no}</Tag>
                  {r.bedrooms != null && <Tag>{r.bedrooms} غرف</Tag>}
                  {r.area != null && <Tag>{r.area} م²</Tag>}
                  {r.bathrooms != null && <Tag>{r.bathrooms} دورات</Tag>}
                  {r.floor != null && <Tag>دور {r.floor}</Tag>}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleSelect(r)}
                    className="btn btn-ghost !py-1.5 !px-3 text-sm"
                    disabled={!isSel && selected.length >= 4}
                    style={isSel ? { background: "var(--brand-soft)", color: "var(--brand-dark)" } : {}}
                  >
                    {isSel ? "✓ للمقارنة" : "＋ قارن"}
                  </button>
                  {r.floor_plan_url && (
                    <a
                      href={r.floor_plan_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost !py-1.5 !px-3 text-sm"
                    >
                      📐 المخطط
                    </a>
                  )}
                  <ShareButton
                    unitId={r.id}
                    summary={`${r.project_name} — ${r.bedrooms ?? ""} غرف${
                      r.area ? ` · ${r.area} م²` : ""
                    }${r.price != null ? ` · ${Number(r.price).toLocaleString("en-US")} ر.س` : ""}`}
                  />
                  {canReserve && <AddToClientButton unitId={r.id} />}
                  {canReserve && r.status === "available" && (
                    <button
                      onClick={() =>
                        setReserveTarget({
                          id: r.id,
                          price: r.price,
                          label: `${r.project_name} — وحدة ${r.unit_no}`,
                        })
                      }
                      className="btn btn-primary !py-1.5 !px-3 text-sm"
                    >
                      احجز
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* شريط المقارنة الثابت */}
      {selected.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 border-t p-3 flex items-center justify-between gap-3 z-20"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-sm font-bold">{selected.length} محدّدة (حتى 4)</span>
          <div className="flex gap-2">
            <button onClick={() => setSelected([])} className="btn btn-ghost text-sm">
              مسح
            </button>
            <button
              onClick={() => setShowCompare(true)}
              className="btn btn-primary text-sm"
              disabled={selected.length < 2}
            >
              قارن ({selected.length})
            </button>
          </div>
        </div>
      )}

      {showCompare && (
        <CompareModal rows={selected} onClose={() => setShowCompare(false)} />
      )}

      {reserveTarget && (
        <ReserveModal
          unit={reserveTarget}
          onClose={() => setReserveTarget(null)}
          onReserved={() => {
            // إزالة الوحدة المحجوزة من نتائج «المتاح»
            setRows((rs) => rs.filter((x) => x.id !== reserveTarget.id));
            setReserveTarget(null);
          }}
        />
      )}
    </div>
  );
}

function CompareModal({
  rows,
  onClose,
}: {
  rows: UnitSearchRow[];
  onClose: () => void;
}) {
  const fmt = (n: number | null, suffix = "") =>
    n != null ? `${Number(n).toLocaleString("en-US")}${suffix}` : "—";
  const spec: { label: string; get: (r: UnitSearchRow) => string }[] = [
    { label: "المشروع", get: (r) => r.project_name },
    { label: "المطوّر", get: (r) => r.developer_name ?? "—" },
    { label: "الحي", get: (r) => `${r.city ?? ""} ${r.district_name ?? ""}` },
    { label: "النموذج", get: (r) => r.model_name ?? "—" },
    { label: "الوحدة", get: (r) => r.unit_no },
    { label: "السعر", get: (r) => fmt(r.price, " ر.س") },
    { label: "الغرف", get: (r) => fmt(r.bedrooms) },
    { label: "المساحة", get: (r) => fmt(r.area, " م²") },
    { label: "دورات المياه", get: (r) => fmt(r.bathrooms) },
    { label: "الدور", get: (r) => fmt(r.floor) },
    { label: "الإطلالة", get: (r) => r.view ?? "—" },
    { label: "الحالة", get: (r) => statusMeta(r.status).label },
  ];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.5)" }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-[820px] max-h-[85vh] overflow-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold m-0">مقارنة الوحدات</h2>
          <button onClick={onClose} className="btn btn-ghost !py-1 !px-3">✕</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {spec.map((row) => (
                <tr key={row.label}>
                  <td
                    className="p-2 font-bold whitespace-nowrap"
                    style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}
                  >
                    {row.label}
                  </td>
                  {rows.map((r) => (
                    <td
                      key={r.id}
                      className="p-2 whitespace-nowrap"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      {row.get(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="field"
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
      {children}
    </span>
  );
}
