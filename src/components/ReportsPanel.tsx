"use client";

import { APP_NAME, DEAL_TYPES, LEAD_STATUSES, LISTING_STATUSES, PROPERTY_TYPES, labelOf } from "@/lib/constants";
import { downloadCSV, toCSV } from "@/lib/export";
import type { ClientLead, Listing } from "@/lib/types";

export function ReportsPanel({
  leads,
  listings,
  brokerName,
}: {
  leads: ClientLead[];
  listings: Listing[];
  brokerName: string;
}) {
  function exportLeads() {
    const rows = leads.map((l) => ({
      client_name: l.client_name,
      phone: l.phone,
      deal_type: labelOf(DEAL_TYPES, l.deal_type),
      property_type:
        l.property_type === "other"
          ? l.property_type_other
          : labelOf(PROPERTY_TYPES, l.property_type),
      city: l.city,
      district: l.district,
      budget: l.budget ?? "",
      status: labelOf(LEAD_STATUSES, l.status),
      notes: l.notes,
      created_at: new Date(l.created_at).toLocaleString("ar-SA"),
    }));
    downloadCSV(
      "aqarly-leads.csv",
      toCSV(rows, [
        { key: "client_name", label: "اسم العميل" },
        { key: "phone", label: "الجوال" },
        { key: "deal_type", label: "نوع الطلب" },
        { key: "property_type", label: "نوع العقار" },
        { key: "city", label: "المدينة" },
        { key: "district", label: "الحي" },
        { key: "budget", label: "الميزانية" },
        { key: "status", label: "الحالة" },
        { key: "notes", label: "ملاحظات" },
        { key: "created_at", label: "التاريخ" },
      ]),
    );
  }

  function exportListings() {
    const rows = listings.map((l) => ({
      title: l.title,
      deal_type: labelOf(DEAL_TYPES, l.deal_type),
      property_type: labelOf(PROPERTY_TYPES, l.property_type),
      city: l.city,
      district: l.district,
      price: l.price ?? "",
      area: l.area ?? "",
      bedrooms: l.bedrooms ?? "",
      status: labelOf(LISTING_STATUSES, l.status),
      created_at: new Date(l.created_at).toLocaleString("ar-SA"),
    }));
    downloadCSV(
      "aqarly-listings.csv",
      toCSV(rows, [
        { key: "title", label: "العنوان" },
        { key: "deal_type", label: "نوع الطلب" },
        { key: "property_type", label: "نوع العقار" },
        { key: "city", label: "المدينة" },
        { key: "district", label: "الحي" },
        { key: "price", label: "السعر" },
        { key: "area", label: "المساحة" },
        { key: "bedrooms", label: "الغرف" },
        { key: "status", label: "الحالة" },
        { key: "created_at", label: "التاريخ" },
      ]),
    );
  }

  return (
    <div>
      <div className="no-print">
        <h1 className="text-2xl font-extrabold mt-0 mb-1">التقارير</h1>
        <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
          صدّر بياناتك إلى Excel، أو اطبع تقريرًا / احفظه PDF.
        </p>
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={exportLeads} className="btn btn-ghost text-sm">
            ⬇ تصدير الطلبات (Excel)
          </button>
          <button onClick={exportListings} className="btn btn-ghost text-sm">
            ⬇ تصدير العروض (Excel)
          </button>
          <button onClick={() => window.print()} className="btn btn-primary text-sm">
            🖨 طباعة / حفظ PDF
          </button>
        </div>
      </div>

      {/* منطقة التقرير القابلة للطباعة */}
      <div className="printable card p-6">
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="text-xl font-extrabold" style={{ color: "var(--brand)" }}>
              {APP_NAME}
            </div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              تقرير الوسيط{brokerName ? ` — ${brokerName}` : ""}
            </div>
          </div>
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            {new Date().toLocaleDateString("ar-SA")}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6 text-center">
          <Summary label="إجمالي الطلبات" value={leads.length} />
          <Summary label="جديدة" value={leads.filter((l) => l.status === "new").length} />
          <Summary label="مكتملة" value={leads.filter((l) => l.status === "done").length} />
          <Summary label="عروض متاحة" value={listings.filter((l) => l.status === "active").length} />
        </div>

        <h3 className="text-base font-bold mb-2">طلبات العملاء</h3>
        <ReportTable
          head={["العميل", "الجوال", "النوع", "المدينة", "الميزانية", "الحالة"]}
          rows={leads.map((l) => [
            l.client_name,
            l.phone,
            labelOf(PROPERTY_TYPES, l.property_type),
            l.city,
            l.budget != null ? Number(l.budget).toLocaleString("en-US") : "—",
            labelOf(LEAD_STATUSES, l.status),
          ])}
        />

        <h3 className="text-base font-bold mb-2 mt-6">العروض</h3>
        <ReportTable
          head={["العنوان", "النوع", "المدينة", "السعر", "الحالة"]}
          rows={listings.map((l) => [
            l.title,
            labelOf(PROPERTY_TYPES, l.property_type),
            l.city,
            l.price != null ? Number(l.price).toLocaleString("en-US") : "—",
            labelOf(LISTING_STATUSES, l.status),
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

function ReportTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        لا توجد بيانات.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="text-right p-2 font-bold"
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
