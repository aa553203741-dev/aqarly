"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VisitBooking, VisitStatus } from "@/lib/types";

const STATUSES: { value: VisitStatus; label: string; color: string }[] = [
  { value: "new", label: "جديد", color: "#2563eb" },
  { value: "confirmed", label: "مؤكّد", color: "#d97706" },
  { value: "done", label: "تمّت", color: "#16a34a" },
  { value: "cancelled", label: "ملغاة", color: "#6b7280" },
];

function fmt(iso: string) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function VisitsList({ initial }: { initial: VisitBooking[] }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<"all" | VisitStatus>("all");

  async function setStatus(id: string, status: VisitStatus) {
    setRows((r) => r.map((v) => (v.id === id ? { ...v, status } : v)));
    const supabase = createClient();
    await supabase.from("visit_bookings").update({ status }).eq("id", id);
  }

  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          الكل ({rows.length})
        </Chip>
        {STATUSES.map((s) => (
          <Chip
            key={s.value}
            active={filter === s.value}
            onClick={() => setFilter(s.value)}
          >
            {s.label} ({rows.filter((r) => r.status === s.value).length})
          </Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد طلبات زيارة بعد.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((v) => (
            <div key={v.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-base">{v.client_name}</div>
                  <a
                    href={`tel:${v.client_phone}`}
                    className="text-sm font-bold"
                    style={{
                      color: "var(--brand)",
                      direction: "ltr",
                      display: "inline-block",
                    }}
                  >
                    {v.client_phone}
                  </a>
                </div>
                <select
                  className="field !w-auto !py-1.5 text-sm font-bold"
                  value={v.status}
                  onChange={(e) => setStatus(v.id, e.target.value as VisitStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 flex-wrap mt-3 text-sm">
                {v.project?.name && (
                  <Tag>
                    {v.project.name}
                    {v.unit?.unit_no ? ` — وحدة ${v.unit.unit_no}` : ""}
                  </Tag>
                )}
                {v.preferred_at && <Tag>⏰ {v.preferred_at}</Tag>}
              </div>

              {v.note && (
                <p className="text-sm mt-2 mb-0" style={{ color: "var(--muted)" }}>
                  {v.note}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 flex-wrap mt-3">
                <a
                  href={`https://wa.me/${v.client_phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost !py-1.5 text-sm"
                >
                  واتساب
                </a>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {fmt(v.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
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
      className="px-3 py-1.5 rounded-lg text-sm font-bold"
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
    <span
      className="badge"
      style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
    >
      {children}
    </span>
  );
}
