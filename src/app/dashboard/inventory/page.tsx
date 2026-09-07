import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { coveredDistrictIds } from "@/lib/me";
import type { DistrictStat } from "@/lib/inventory-types";

export default async function InventoryHomePage() {
  const supabase = await createClient();
  const covered = await coveredDistrictIds();
  let query = supabase.from("district_stats").select("*").order("city");
  if (covered) query = query.in("district_id", covered);
  const { data } = await query;

  const stats = (data as DistrictStat[]) ?? [];

  // تجميع حسب المدينة
  const byCity = new Map<string, DistrictStat[]>();
  for (const d of stats) {
    if (!byCity.has(d.city)) byCity.set(d.city, []);
    byCity.get(d.city)!.push(d);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold m-0">خريطة التغطية</h1>
        <Link href="/dashboard/search" className="btn btn-primary text-sm">
          🔎 بحث لعميلك
        </Link>
      </div>

      {stats.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد أحياء بعد. أضِف مشروعًا من «المشاريع» ليظهر حيّه هنا.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {[...byCity.entries()].map(([city, districts]) => (
            <div key={city}>
              <h2 className="text-lg font-bold mb-3">{city}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {districts.map((d) => (
                  <Link
                    key={d.district_id}
                    href={`/dashboard/inventory/${d.district_id}`}
                    className="card p-4 no-underline"
                    style={{ color: "var(--text)" }}
                  >
                    <div className="font-bold text-base">{d.district_name}</div>
                    {d.zone && (
                      <div className="text-xs" style={{ color: "var(--muted)" }}>
                        {d.zone}
                      </div>
                    )}
                    <div className="text-sm mt-2" style={{ color: "var(--muted)" }}>
                      {d.projects_count} مشاريع
                    </div>
                    <div
                      className="text-sm font-bold mt-0.5"
                      style={{ color: "var(--brand)" }}
                    >
                      {d.available_units} وحدة متاحة
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
