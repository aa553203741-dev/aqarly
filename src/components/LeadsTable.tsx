"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEAL_TYPES,
  LEAD_STATUSES,
  PROPERTY_TYPES,
  labelOf,
} from "@/lib/constants";
import type { ClientLead, LeadStatus } from "@/lib/types";

export function LeadsTable({ initial }: { initial: ClientLead[] }) {
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");

  async function setStatus(id: string, status: LeadStatus) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    const supabase = createClient();
    await supabase.from("client_leads").update({ status }).eq("id", id);
  }

  const shown = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          الكل ({leads.length})
        </FilterChip>
        {LEAD_STATUSES.map((s) => (
          <FilterChip
            key={s.value}
            active={filter === s.value}
            onClick={() => setFilter(s.value)}
          >
            {s.label} ({leads.filter((l) => l.status === s.value).length})
          </FilterChip>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد طلبات بعد.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((l) => (
            <div key={l.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-base">{l.client_name}</div>
                  <a
                    href={`tel:${l.phone}`}
                    className="text-sm font-bold"
                    style={{ color: "var(--brand)", direction: "ltr", display: "inline-block" }}
                  >
                    {l.phone}
                  </a>
                </div>
                <select
                  className="field !w-auto !py-1.5 text-sm font-bold"
                  value={l.status}
                  onChange={(e) => setStatus(l.id, e.target.value as LeadStatus)}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 flex-wrap mt-3 text-sm">
                <Tag>{labelOf(DEAL_TYPES, l.deal_type)}</Tag>
                <Tag>
                  {l.property_type === "other"
                    ? l.property_type_other || "غير ذلك"
                    : labelOf(PROPERTY_TYPES, l.property_type)}
                </Tag>
                <Tag>{l.city}{l.district ? ` — ${l.district}` : ""}</Tag>
                {l.budget != null && (
                  <Tag>{Number(l.budget).toLocaleString("en-US")} ر.س</Tag>
                )}
              </div>
              {l.notes && (
                <p className="text-sm mt-2 mb-0" style={{ color: "var(--muted)" }}>
                  {l.notes}
                </p>
              )}
              <div className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                {new Date(l.created_at).toLocaleString("ar-SA")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
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
