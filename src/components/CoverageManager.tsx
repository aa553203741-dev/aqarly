"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { District } from "@/lib/inventory-types";

export type CoverageData = {
  marketers: { id: string; full_name: string | null; email: string | null }[];
  districts: District[];
  coverage: { marketer_id: string; district_id: string }[];
};

export function CoverageManager({ data }: { data: CoverageData }) {
  const [marketerId, setMarketerId] = useState(data.marketers[0]?.id ?? "");
  // مجموعة الأحياء المغطّاة لكل مسوّق
  const [cov, setCov] = useState<Set<string>>(
    () => new Set(data.coverage.map((c) => `${c.marketer_id}:${c.district_id}`)),
  );

  const districtsByCity = useMemo(() => {
    const m = new Map<string, District[]>();
    for (const d of data.districts) {
      if (!m.has(d.city)) m.set(d.city, []);
      m.get(d.city)!.push(d);
    }
    return m;
  }, [data.districts]);

  const isCovered = (districtId: string) =>
    cov.has(`${marketerId}:${districtId}`);

  async function toggle(districtId: string) {
    if (!marketerId) return;
    const key = `${marketerId}:${districtId}`;
    const supabase = createClient();
    const next = new Set(cov);
    if (next.has(key)) {
      next.delete(key);
      setCov(next);
      await supabase
        .from("marketer_coverage")
        .delete()
        .eq("marketer_id", marketerId)
        .eq("district_id", districtId);
    } else {
      next.add(key);
      setCov(next);
      await supabase
        .from("marketer_coverage")
        .insert({ marketer_id: marketerId, district_id: districtId });
    }
  }

  const coveredCount = data.districts.filter((d) => isCovered(d.id)).length;

  return (
    <div>
      <div className="card p-4 mb-4">
        <label className="label">المسوّق</label>
        <select
          className="field"
          value={marketerId}
          onChange={(e) => setMarketerId(e.target.value)}
        >
          {data.marketers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name || m.email}
            </option>
          ))}
        </select>
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          {coveredCount === 0
            ? "بلا تخصيص — يرى كل الأحياء."
            : `مغطّى ${coveredCount} حي.`}
        </p>
      </div>

      {data.districts.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا أحياء بعد. أضِف مشاريع لتظهر أحياؤها.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[...districtsByCity.entries()].map(([city, districts]) => (
            <div key={city} className="card p-4">
              <div className="font-bold mb-2">{city}</div>
              <div className="flex gap-2 flex-wrap">
                {districts.map((d) => {
                  const on = isCovered(d.id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggle(d.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-bold"
                      style={{
                        background: on ? "var(--brand)" : "var(--surface)",
                        color: on ? "#fff" : "var(--muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {on ? "✓ " : ""}
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
