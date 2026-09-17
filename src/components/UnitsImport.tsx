"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UnitModel } from "@/lib/inventory-types";

// ترتيب أعمدة القالب (عربي) → مفاتيح داخلية
const COLS: { header: string; key: string }[] = [
  { header: "رقم الوحدة", key: "unit_no" },
  { header: "النموذج", key: "model" },
  { header: "الدور", key: "floor" },
  { header: "رقم المبنى", key: "building_no" },
  { header: "السعر", key: "price" },
  { header: "سعر الخصم", key: "discount_price" },
  { header: "الحالة", key: "status" },
  { header: "الإطلالة", key: "view" },
  { header: "الاتجاه", key: "direction" },
  { header: "الغرف", key: "bedrooms" },
  { header: "المساحة", key: "area" },
  { header: "دورات المياه", key: "bathrooms" },
  { header: "العمولة", key: "commission" },
  { header: "ملاحظات", key: "notes" },
];

const STATUS_MAP: Record<string, string> = {
  متاح: "available",
  محجوز: "reserved",
  مباع: "sold",
  "غير متاح": "unavailable",
  available: "available",
  reserved: "reserved",
  sold: "sold",
  unavailable: "unavailable",
};
const NUMERIC = ["floor", "price", "discount_price", "bedrooms", "area", "bathrooms", "commission"];

type Parsed = Record<string, string>;
type RowResult = {
  row: Parsed;
  errors: string[];
  duplicate: boolean;
};

// مُحلّل CSV بسيط يدعم الحقول المقتبسة والفواصل داخلها.
function parseCSV(text: string): string[][] {
  const t = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((x) => x.trim() !== "")) rows.push(row);
  }
  return rows;
}

export function UnitsImport({
  projectId,
  initialModels,
  canManage,
}: {
  projectId: string;
  initialModels: UnitModel[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState("");

  if (!canManage) return null;

  function downloadTemplate() {
    const example = [
      "A-101", "روف", "1", "A", "470000", "", "متاح",
      "شمالية", "شمال", "3", "105", "3", "15000", "",
    ];
    const csv =
      "﻿" +
      COLS.map((c) => c.header).join(",") +
      "\n" +
      example.join(",") +
      "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "قالب_استيراد_الوحدات.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setReport("");
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setReport("الملف فارغ أو بلا بيانات.");
      return;
    }
    // خريطة الأعمدة من صف العناوين
    const headers = rows[0].map((h) => h.trim());
    const idx: Record<string, number> = {};
    COLS.forEach((c) => {
      const i = headers.indexOf(c.header);
      if (i !== -1) idx[c.key] = i;
    });
    if (idx.unit_no === undefined) {
      setReport('لم يُعثر على عمود «رقم الوحدة». استخدم القالب.');
      return;
    }

    // كشف التكرار: أرقام الوحدات الموجودة في المشروع
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("units")
      .select("unit_no")
      .eq("project_id", projectId);
    const existingNos = new Set(
      ((existing as { unit_no: string }[]) ?? []).map((u) => u.unit_no.trim()),
    );

    const seen = new Set<string>();
    const out: RowResult[] = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      const row: Parsed = {};
      COLS.forEach((c) => {
        if (idx[c.key] !== undefined) row[c.key] = (cells[idx[c.key]] ?? "").trim();
      });
      const errors: string[] = [];
      if (!row.unit_no) errors.push("رقم الوحدة مفقود");
      for (const k of NUMERIC) {
        if (row[k] && !Number.isFinite(Number(row[k])))
          errors.push(`${k} ليس رقمًا`);
      }
      if (row.status && !STATUS_MAP[row.status]) errors.push("حالة غير صالحة");

      let duplicate = false;
      if (row.unit_no) {
        if (existingNos.has(row.unit_no) || seen.has(row.unit_no)) duplicate = true;
        seen.add(row.unit_no);
      }
      out.push({ row, errors, duplicate });
    }
    setResults(out);
  }

  async function doImport() {
    if (!results) return;
    setBusy(true);
    setReport("");
    const supabase = createClient();

    const valid = results.filter((r) => r.errors.length === 0 && !r.duplicate);

    // 1) إنشاء النماذج الناقصة (بالاسم)
    const modelMap = new Map<string, string>();
    initialModels.forEach((m) => modelMap.set(m.name.trim().toLowerCase(), m.id));

    const newModels = new Map<string, Parsed>();
    for (const { row } of valid) {
      const name = row.model?.trim();
      if (name && !modelMap.has(name.toLowerCase()) && !newModels.has(name.toLowerCase())) {
        newModels.set(name.toLowerCase(), row);
      }
    }
    if (newModels.size > 0) {
      const payload = [...newModels.values()].map((row) => ({
        project_id: projectId,
        name: row.model.trim(),
        bedrooms: row.bedrooms ? Number(row.bedrooms) : null,
        area: row.area ? Number(row.area) : null,
        bathrooms: row.bathrooms ? Number(row.bathrooms) : null,
      }));
      const { data: created } = await supabase
        .from("unit_models")
        .insert(payload)
        .select("id, name");
      ((created as { id: string; name: string }[]) ?? []).forEach((m) =>
        modelMap.set(m.name.trim().toLowerCase(), m.id),
      );
    }

    // 2) إدراج الوحدات
    const payload = valid.map(({ row }) => ({
      project_id: projectId,
      model_id: row.model ? modelMap.get(row.model.trim().toLowerCase()) ?? null : null,
      unit_no: row.unit_no,
      floor: row.floor ? Number(row.floor) : null,
      building_no: row.building_no || null,
      price: row.price ? Number(row.price) : null,
      discount_price: row.discount_price ? Number(row.discount_price) : null,
      status: row.status ? STATUS_MAP[row.status] : "available",
      view: row.view || null,
      direction: row.direction || null,
      commission_amount: row.commission ? Number(row.commission) : null,
      notes: row.notes || "",
    }));

    let added = 0;
    const CHUNK = 200;
    let failed = false;
    for (let i = 0; i < payload.length; i += CHUNK) {
      const { data, error } = await supabase
        .from("units")
        .insert(payload.slice(i, i + CHUNK))
        .select("id");
      if (error) {
        failed = true;
        break;
      }
      added += (data as unknown[])?.length ?? 0;
    }

    setBusy(false);
    const skipped = results.length - valid.length;
    if (failed) {
      setReport(`تعذّر الإكمال. أُضيفت ${added} قبل التوقّف. تأكّد من صلاحيتك.`);
    } else {
      setReport(`✅ أُضيفت ${added} وحدة · تُخطّيت ${skipped} (مكرّرة أو بها أخطاء).`);
    }
    setResults(null);
    router.refresh();
  }

  const validCount = results?.filter((r) => r.errors.length === 0 && !r.duplicate).length ?? 0;
  const skipCount = results ? results.length - validCount : 0;

  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold m-0">استيراد وحدات من Excel</h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="btn btn-ghost text-sm"
        >
          {open ? "إغلاق" : "فتح"}
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm m-0" style={{ color: "var(--muted)" }}>
            نزّل القالب، عبّئه في Excel واحفظه بصيغة <b>CSV UTF-8</b>، ثم ارفعه.
            المكرّر (بنفس رقم الوحدة) يُتخطّى تلقائيًا.
          </p>

          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadTemplate} className="btn btn-ghost text-sm">
              ⬇ تنزيل القالب
            </button>
            <label className="btn btn-primary text-sm cursor-pointer">
              رفع ملف CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onFile}
              />
            </label>
          </div>

          {report && (
            <p className="text-sm font-bold m-0" style={{ color: "var(--brand-dark)" }}>
              {report}
            </p>
          )}

          {results && (
            <div>
              <div className="flex gap-2 flex-wrap mb-2 text-sm">
                <span className="badge" style={{ background: "var(--brand)", color: "#fff" }}>
                  {validCount} جاهزة
                </span>
                <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
                  {skipCount} تُتخطّى
                </span>
              </div>

              <div className="overflow-x-auto" style={{ maxHeight: 320 }}>
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "var(--muted)" }}>
                      <th className="p-2 text-right">رقم الوحدة</th>
                      <th className="p-2 text-right">النموذج</th>
                      <th className="p-2 text-right">السعر</th>
                      <th className="p-2 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 100).map((r, i) => {
                      const bad = r.errors.length > 0;
                      return (
                        <tr
                          key={i}
                          style={{
                            borderTop: "1px solid var(--border)",
                            opacity: bad || r.duplicate ? 0.55 : 1,
                          }}
                        >
                          <td className="p-2 font-bold">{r.row.unit_no || "—"}</td>
                          <td className="p-2">{r.row.model || "—"}</td>
                          <td className="p-2">{r.row.price || "—"}</td>
                          <td className="p-2">
                            {bad ? (
                              <span style={{ color: "var(--danger)" }}>
                                {r.errors.join("، ")}
                              </span>
                            ) : r.duplicate ? (
                              <span style={{ color: "var(--muted)" }}>مكرّرة — تُتخطّى</span>
                            ) : (
                              <span style={{ color: "var(--brand)" }}>جاهزة</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {results.length > 100 && (
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    تُعرض أول 100 صف من {results.length}.
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={doImport}
                  disabled={busy || validCount === 0}
                  className="btn btn-primary"
                >
                  {busy ? "جارِ الاستيراد…" : `استيراد ${validCount} وحدة`}
                </button>
                <button onClick={() => setResults(null)} className="btn btn-ghost">
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
