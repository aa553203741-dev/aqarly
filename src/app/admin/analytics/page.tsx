import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { Logo } from "@/components/Logo";

type Res = {
  stage: string;
  commission_status: string;
  commission_amount: number | null;
  agreed_price: number | null;
  reserved_at: string;
  marketer_id: string;
  marketer?: { full_name: string | null; email: string | null } | null;
};

const money = (n: number) => n.toLocaleString("en-US");

export default async function AnalyticsPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.isAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const [
    unitsAll,
    { count: projectsCount },
    { count: developersCount },
    { data: resData },
    { data: districts },
  ] = await Promise.all([
    supabase.from("units").select("status"),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("developers").select("*", { count: "exact", head: true }),
    supabase
      .from("reservations")
      .select(
        "stage, commission_status, commission_amount, agreed_price, reserved_at, marketer_id, marketer:profiles!reservations_marketer_id_fkey(full_name, email)",
      ),
    supabase
      .from("district_stats")
      .select("district_name, city, available_units, projects_count"),
  ]);

  const units = (unitsAll.data as { status: string }[]) ?? [];
  const uCount = (s: string) => units.filter((u) => u.status === s).length;

  const res = (resData as unknown as Res[]) ?? [];
  const active = res.filter((r) => r.stage !== "cancelled");
  const closed = res.filter((r) => r.stage === "closed");
  const cancelled = res.filter((r) => r.stage === "cancelled");
  const closeRate = active.length
    ? Math.round((closed.length / active.length) * 100)
    : 0;
  const salesValue = closed.reduce((s, r) => s + (r.agreed_price ?? 0), 0);
  const commEarned = res
    .filter((r) => r.commission_status !== "pending" && r.stage !== "cancelled")
    .reduce((s, r) => s + (r.commission_amount ?? 0), 0);
  const commPending = res
    .filter((r) => r.commission_status === "pending" && r.stage !== "cancelled")
    .reduce((s, r) => s + (r.commission_amount ?? 0), 0);

  // الحجوزات الشهرية (آخر 6 أشهر)
  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = active.filter((r) => {
      const rd = new Date(r.reserved_at);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    }).length;
    months.push({ label: d.toLocaleDateString("ar-SA", { month: "short" }), count });
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.count));

  // أفضل المسوّقين
  const byMarketer = new Map<string, { name: string; count: number; comm: number }>();
  for (const r of active) {
    const name = r.marketer?.full_name || r.marketer?.email || "—";
    const cur = byMarketer.get(r.marketer_id) ?? { name, count: 0, comm: 0 };
    cur.count++;
    if (r.commission_status !== "pending") cur.comm += r.commission_amount ?? 0;
    byMarketer.set(r.marketer_id, cur);
  }
  const topMarketers = [...byMarketer.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  const topDistricts = (
    (districts as { district_name: string; city: string; available_units: number }[]) ?? []
  )
    .sort((a, b) => b.available_units - a.available_units)
    .slice(0, 5);

  return (
    <div className="flex-1 w-full max-w-[1000px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Logo size={30} />
        <Link href="/admin" className="btn btn-ghost text-sm">
          ← لوحة الأدمن
        </Link>
      </div>
      <h1 className="text-2xl font-extrabold mt-0 mb-5">التحليلات</h1>

      {/* المخزون */}
      <h2 className="text-base font-bold mb-3">المخزون</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="متاحة" value={uCount("available")} color="#16a34a" />
        <Stat label="محجوزة" value={uCount("reserved")} color="#d97706" />
        <Stat label="مباعة" value={uCount("sold")} color="#dc2626" />
        <Stat label="إجمالي الوحدات" value={units.length} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="المشاريع" value={projectsCount ?? 0} />
        <Stat label="المطوّرون" value={developersCount ?? 0} />
        <Stat label="حجوزات نشطة" value={active.length} />
        <Stat label="معدّل الإقفال" value={`${closeRate}%`} color="var(--brand)" />
      </div>

      {/* المبيعات والعمولات */}
      <h2 className="text-base font-bold mb-3">المبيعات والعمولات</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="قيمة المبيعات" value={`${money(salesValue)} ر.س`} color="var(--brand)" big />
        <Stat label="صفقات مكتملة" value={closed.length} />
        <Stat label="عمولات مستحقة/مدفوعة" value={`${money(commEarned)} ر.س`} color="var(--gold)" />
        <Stat label="عمولات قيد الإجراء" value={`${money(commPending)} ر.س`} />
      </div>

      {/* الحجوزات الشهرية */}
      <div className="card p-5 mb-6">
        <h2 className="text-base font-bold mt-0 mb-4">الحجوزات (آخر 6 أشهر)</h2>
        <div className="flex items-end gap-3 h-36">
          {months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs font-bold" style={{ color: "var(--muted)" }}>
                {m.count || ""}
              </div>
              <div
                className="w-full rounded-t-lg"
                style={{
                  height: `${(m.count / maxMonth) * 100}%`,
                  minHeight: m.count > 0 ? 6 : 2,
                  background: m.count > 0 ? "var(--brand)" : "var(--border)",
                }}
              />
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* أفضل المسوّقين */}
        <div className="card p-5">
          <h2 className="text-base font-bold mt-0 mb-3">أفضل المسوّقين (حجوزات)</h2>
          {topMarketers.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>لا بيانات بعد.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topMarketers.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-bold">{m.name}</span>
                  <span style={{ color: "var(--muted)" }}>
                    {m.count} حجز · {money(m.comm)} ر.س
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* أكثر الأحياء توفّرًا */}
        <div className="card p-5">
          <h2 className="text-base font-bold mt-0 mb-3">أكثر الأحياء توفّرًا</h2>
          {topDistricts.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>لا بيانات بعد.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topDistricts.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-bold">
                    {d.district_name}{" "}
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {d.city}
                    </span>
                  </span>
                  <span style={{ color: "var(--brand)" }}>{d.available_units} متاحة</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  big,
}: {
  label: string;
  value: string | number;
  color?: string;
  big?: boolean;
}) {
  return (
    <div className="card p-4">
      <div
        className="font-extrabold"
        style={{ color: color ?? "var(--text)", fontSize: big ? 22 : 24 }}
      >
        {value}
      </div>
      <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}
