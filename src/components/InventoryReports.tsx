"use client";

import { APP_NAME } from "@/lib/constants";
import { RESERVATION_STAGE, UNIT_STATUS } from "@/lib/inventory-constants";
import { downloadCSV, toCSV } from "@/lib/export";
import type { InventoryUnit } from "@/app/admin/reports/page";

type Res = {
  project_name: string;
  unit_no: string;
  marketer: string;
  client_name: string;
  stage: string;
  agreed_price: number | null;
  commission_amount: number | null;
  commission_status: string;
  reserved_at: string;
};

const money = (n: number | null) =>
  n != null ? Number(n).toLocaleString("en-US") : "";
const unitStatusLbl = (v: string) =>
  UNIT_STATUS.find((s) => s.value === v)?.label ?? v;
const stageLbl = (v: string) =>
  RESERVATION_STAGE.find((s) => s.value === v)?.label ?? v;
const commLbl: Record<string, string> = {
  pending: "قيد الإجراء",
  earned: "مستحقة",
  paid: "مدفوعة",
};

export function InventoryReports({
  units,
  reservations,
}: {
  units: InventoryUnit[];
  reservations: Res[];
}) {
  function exportUnits() {
    const rows = units.map((u) => ({
      project: u.project_name,
      developer: u.developer_name ?? "",
      city: u.city ?? "",
      district: u.district_name ?? "",
      model: u.model_name ?? "",
      unit_no: u.unit_no,
      floor: u.floor ?? "",
      bedrooms: u.bedrooms ?? "",
      area: u.area ?? "",
      price: u.price ?? "",
      status: unitStatusLbl(u.status),
      commission: u.commission_amount ?? "",
    }));
    downloadCSV(
      "aqarly-inventory.csv",
      toCSV(rows, [
        { key: "project", label: "المشروع" },
        { key: "developer", label: "المطوّر" },
        { key: "city", label: "المدينة" },
        { key: "district", label: "الحي" },
        { key: "model", label: "النموذج" },
        { key: "unit_no", label: "الوحدة" },
        { key: "floor", label: "الدور" },
        { key: "bedrooms", label: "الغرف" },
        { key: "area", label: "المساحة" },
        { key: "price", label: "السعر" },
        { key: "status", label: "الحالة" },
        { key: "commission", label: "العمولة" },
      ]),
    );
  }

  function exportReservations() {
    const rows = reservations.map((r) => ({
      project: r.project_name,
      unit_no: r.unit_no,
      marketer: r.marketer,
      client: r.client_name,
      stage: stageLbl(r.stage),
      price: r.agreed_price ?? "",
      commission: r.commission_amount ?? "",
      commission_status: commLbl[r.commission_status] ?? r.commission_status,
      date: new Date(r.reserved_at).toLocaleDateString("ar-SA"),
    }));
    downloadCSV(
      "aqarly-reservations.csv",
      toCSV(rows, [
        { key: "project", label: "المشروع" },
        { key: "unit_no", label: "الوحدة" },
        { key: "marketer", label: "المسوّق" },
        { key: "client", label: "العميل" },
        { key: "stage", label: "المرحلة" },
        { key: "price", label: "السعر" },
        { key: "commission", label: "العمولة" },
        { key: "commission_status", label: "حالة العمولة" },
        { key: "date", label: "التاريخ" },
      ]),
    );
  }

  // ملخّص العمولات لكل مسوّق
  const commByMarketer = new Map<
    string,
    { earned: number; pending: number; deals: number }
  >();
  for (const r of reservations) {
    if (r.stage === "cancelled") continue;
    const cur = commByMarketer.get(r.marketer) ?? {
      earned: 0,
      pending: 0,
      deals: 0,
    };
    cur.deals++;
    if (r.commission_status === "pending") cur.pending += r.commission_amount ?? 0;
    else cur.earned += r.commission_amount ?? 0;
    commByMarketer.set(r.marketer, cur);
  }
  const commRows = [...commByMarketer.entries()];

  function exportCommissions() {
    const rows = commRows.map(([marketer, c]) => ({
      marketer,
      deals: c.deals,
      earned: c.earned,
      pending: c.pending,
    }));
    downloadCSV(
      "aqarly-commissions.csv",
      toCSV(rows, [
        { key: "marketer", label: "المسوّق" },
        { key: "deals", label: "عدد الصفقات" },
        { key: "earned", label: "عمولات مستحقة/مدفوعة" },
        { key: "pending", label: "عمولات قيد الإجراء" },
      ]),
    );
  }

  const available = units.filter((u) => u.status === "available").length;
  const sold = units.filter((u) => u.status === "sold").length;

  return (
    <div>
      <div className="no-print">
        <h1 className="text-2xl font-extrabold mt-0 mb-1">تقارير المخزون</h1>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          صدّر إلى Excel أو اطبع / احفظ PDF.
        </p>
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={exportUnits} className="btn btn-ghost text-sm">
            ⬇ المخزون (Excel)
          </button>
          <button onClick={exportReservations} className="btn btn-ghost text-sm">
            ⬇ الحجوزات (Excel)
          </button>
          <button onClick={exportCommissions} className="btn btn-ghost text-sm">
            ⬇ العمولات (Excel)
          </button>
          <button onClick={() => window.print()} className="btn btn-primary text-sm">
            🖨 طباعة / PDF
          </button>
        </div>
      </div>

      <div className="printable card p-6">
        <div
          className="flex items-center justify-between mb-4 pb-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="text-xl font-extrabold" style={{ color: "var(--brand)" }}>
            {APP_NAME}
          </div>
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            تقرير المخزون · {new Date().toLocaleDateString("ar-SA")}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6 text-center">
          <Summary label="إجمالي الوحدات" value={units.length} />
          <Summary label="متاحة" value={available} />
          <Summary label="مباعة" value={sold} />
          <Summary label="الحجوزات" value={reservations.length} />
        </div>

        <h3 className="text-base font-bold mb-2">ملخّص عمولات المسوّقين</h3>
        {commRows.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>لا بيانات.</p>
        ) : (
          <Table
            head={["المسوّق", "الصفقات", "مستحقة", "قيد الإجراء"]}
            rows={commRows.map(([m, c]) => [
              m,
              String(c.deals),
              money(c.earned),
              money(c.pending),
            ])}
          />
        )}

        <h3 className="text-base font-bold mb-2 mt-6">المخزون</h3>
        <Table
          head={["المشروع", "الوحدة", "الغرف", "السعر", "الحالة"]}
          rows={units
            .slice(0, 200)
            .map((u) => [
              u.project_name,
              u.unit_no,
              u.bedrooms != null ? String(u.bedrooms) : "—",
              money(u.price) || "—",
              unitStatusLbl(u.status),
            ])}
        />
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-3">
      <div className="text-2xl font-extrabold" style={{ color: "var(--brand)" }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  if (rows.length === 0)
    return (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        لا بيانات.
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="text-right p-2 font-bold whitespace-nowrap"
                style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td
                  key={j}
                  className="p-2"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
