"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEAL_TYPES,
  LEAD_STATUSES,
  PROPERTY_TYPES,
  labelOf,
} from "@/lib/constants";
import type { ClientLead, LeadStatus, LeadSuggestion } from "@/lib/types";

export type PickOption = {
  kind: "unit" | "listing";
  ref_id: string;
  title: string;
  subtitle: string;
  price: number | null;
};

export function LeadsTable({
  initial,
  suggestions,
  unitOptions,
  listingOptions,
}: {
  initial: ClientLead[];
  suggestions: LeadSuggestion[];
  unitOptions: PickOption[];
  listingOptions: PickOption[];
}) {
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [sugg, setSugg] = useState<LeadSuggestion[]>(suggestions);
  const [pickFor, setPickFor] = useState<ClientLead | null>(null);

  async function setStatus(id: string, status: LeadStatus) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    const supabase = createClient();
    await supabase.from("client_leads").update({ status }).eq("id", id);
  }

  async function addSuggestion(lead: ClientLead, opt: PickOption) {
    const supabase = createClient();
    const row = {
      lead_id: lead.id,
      kind: opt.kind,
      ref_id: opt.ref_id,
      title: opt.title,
      subtitle: opt.subtitle,
      price: opt.price,
    };
    const { data, error } = await supabase
      .from("lead_suggestions")
      .insert(row)
      .select("*")
      .single();
    if (!error && data) {
      setSugg((s) => [data as LeadSuggestion, ...s]);
    }
  }

  async function removeSuggestion(id: string) {
    setSugg((s) => s.filter((x) => x.id !== id));
    const supabase = createClient();
    await supabase.from("lead_suggestions").delete().eq("id", id);
  }

  const shown =
    filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const alreadyPicked = useMemo(() => {
    if (!pickFor) return new Set<string>();
    return new Set(
      sugg
        .filter((s) => s.lead_id === pickFor.id)
        .map((s) => `${s.kind}:${s.ref_id}`),
    );
  }, [sugg, pickFor]);

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
          {shown.map((l) => {
            const leadSugg = sugg.filter((s) => s.lead_id === l.id);
            return (
              <div key={l.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-bold text-base">{l.client_name}</div>
                    <a
                      href={`tel:${l.phone}`}
                      className="text-sm font-bold"
                      style={{
                        color: "var(--brand)",
                        direction: "ltr",
                        display: "inline-block",
                      }}
                    >
                      {l.phone}
                    </a>
                  </div>
                  <select
                    className="field !w-auto !py-1.5 text-sm font-bold"
                    value={l.status}
                    onChange={(e) =>
                      setStatus(l.id, e.target.value as LeadStatus)
                    }
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
                  <Tag>
                    {l.city}
                    {l.district ? ` — ${l.district}` : ""}
                  </Tag>
                  {l.budget != null && (
                    <Tag>{Number(l.budget).toLocaleString("en-US")} ر.س</Tag>
                  )}
                </div>
                {l.notes && (
                  <p className="text-sm mt-2 mb-0" style={{ color: "var(--muted)" }}>
                    {l.notes}
                  </p>
                )}

                {/* العقارات المقترحة لهذا العميل */}
                {leadSugg.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div
                      className="text-xs font-bold"
                      style={{ color: "var(--muted)" }}
                    >
                      عقارات مقترحة ({leadSugg.length})
                    </div>
                    {leadSugg.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 flex-wrap text-sm p-2 rounded-lg"
                        style={{ background: "var(--brand-soft)" }}
                      >
                        <span
                          className="badge"
                          style={{
                            background:
                              s.kind === "unit" ? "var(--brand)" : "var(--gold)",
                            color: "#fff",
                          }}
                        >
                          {s.kind === "unit" ? "مخزون" : "عرض"}
                        </span>
                        <span className="font-bold">{s.title}</span>
                        {s.subtitle && (
                          <span style={{ color: "var(--muted)" }}>
                            {s.subtitle}
                          </span>
                        )}
                        {s.price != null && (
                          <span style={{ color: "var(--brand-dark)" }}>
                            {Number(s.price).toLocaleString("en-US")} ر.س
                          </span>
                        )}
                        <button
                          onClick={() => removeSuggestion(s.id)}
                          className="mr-auto text-xs"
                          style={{ color: "var(--danger, #dc2626)" }}
                          aria-label="إزالة"
                        >
                          إزالة ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 flex-wrap mt-3">
                  <button
                    onClick={() => setPickFor(l)}
                    className="btn btn-primary text-sm"
                  >
                    + اقترح عقارًا
                  </button>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {new Date(l.created_at).toLocaleString("ar-SA")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pickFor && (
        <PickerModal
          lead={pickFor}
          unitOptions={unitOptions}
          listingOptions={listingOptions}
          alreadyPicked={alreadyPicked}
          onPick={(opt) => addSuggestion(pickFor, opt)}
          onClose={() => setPickFor(null)}
        />
      )}
    </div>
  );
}

function PickerModal({
  lead,
  unitOptions,
  listingOptions,
  alreadyPicked,
  onPick,
  onClose,
}: {
  lead: ClientLead;
  unitOptions: PickOption[];
  listingOptions: PickOption[];
  alreadyPicked: Set<string>;
  onPick: (opt: PickOption) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"unit" | "listing">("unit");
  const [q, setQ] = useState("");

  const source = tab === "unit" ? unitOptions : listingOptions;
  const list = useMemo(() => {
    const term = q.trim();
    if (!term) return source.slice(0, 100);
    return source
      .filter(
        (o) =>
          o.title.includes(term) ||
          o.subtitle.includes(term),
      )
      .slice(0, 100);
  }, [source, q]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={onClose}
    >
      <div
        className="card w-full sm:max-w-lg max-h-[85vh] flex flex-col p-0 rounded-b-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base m-0">
              اقترح عقارًا لـ {lead.client_name}
            </h3>
            <button onClick={onClose} aria-label="إغلاق" className="text-lg">
              ✕
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <TabBtn active={tab === "unit"} onClick={() => setTab("unit")}>
              من المخزون ({unitOptions.length})
            </TabBtn>
            <TabBtn active={tab === "listing"} onClick={() => setTab("listing")}>
              العروض المتاحة ({listingOptions.length})
            </TabBtn>
          </div>
          <input
            className="field mt-3"
            placeholder="ابحث بالاسم أو الحي…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-2">
          {list.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--muted)" }}>
              {source.length === 0
                ? tab === "unit"
                  ? "لا توجد وحدات متاحة في تغطيتك."
                  : "لا توجد عروض متاحة."
                : "لا نتائج مطابقة."}
            </div>
          ) : (
            list.map((o) => {
              const picked = alreadyPicked.has(`${o.kind}:${o.ref_id}`);
              return (
                <button
                  key={`${o.kind}:${o.ref_id}`}
                  disabled={picked}
                  onClick={() => {
                    onPick(o);
                    onClose();
                  }}
                  className="text-right p-3 rounded-lg flex flex-col gap-1"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    opacity: picked ? 0.5 : 1,
                    cursor: picked ? "default" : "pointer",
                  }}
                >
                  <span className="font-bold text-sm">{o.title}</span>
                  <span className="text-xs flex items-center gap-2 flex-wrap">
                    {o.subtitle && (
                      <span style={{ color: "var(--muted)" }}>{o.subtitle}</span>
                    )}
                    {o.price != null && (
                      <span
                        className="font-bold"
                        style={{ color: "var(--brand)" }}
                      >
                        {Number(o.price).toLocaleString("en-US")} ر.س
                      </span>
                    )}
                    {picked && (
                      <span style={{ color: "var(--brand-dark)" }}>
                        ✓ مضاف
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

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
      className="px-3 py-1.5 rounded-lg text-sm font-bold flex-1"
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
