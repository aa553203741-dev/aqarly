import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMe, coveredDistrictIds } from "@/lib/me";
import { Icon } from "@/components/Icon";

export default async function OverviewPage() {
  const supabase = await createClient();
  const me = await getMe();
  const covered = await coveredDistrictIds();

  let unitsQ = supabase
    .from("units_search")
    .select("*", { count: "exact", head: true })
    .eq("status", "available");
  if (covered) unitsQ = unitsQ.in("district_id", covered);

  const [
    newVisits,
    newLeads,
    progLeads,
    openRes,
    availUnits,
    listingsActive,
    pending,
  ] = await Promise.all([
    supabase.from("visit_bookings").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("client_leads").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("client_leads").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .not("stage", "in", "(closed,cancelled)"),
    unitsQ,
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    me?.isAdmin
      ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending")
      : Promise.resolve({ count: 0 as number | null }),
  ]);

  const name = me?.profile?.full_name || me?.profile?.email || "وسيط";

  type Task = {
    count: number;
    label: string;
    icon: string;
    href: string;
    color: string;
  };
  const tasks: Task[] = [
    { count: newVisits.count ?? 0, label: "طلبات زيارة جديدة", icon: "calendar", href: "/dashboard/visits", color: "#2563eb" },
    { count: newLeads.count ?? 0, label: "طلبات عملاء جديدة", icon: "inbox", href: "/dashboard/leads", color: "#7c3aed" },
    { count: progLeads.count ?? 0, label: "عملاء قيد المتابعة", icon: "users", href: "/dashboard/leads", color: "#0891b2" },
    { count: openRes.count ?? 0, label: "حجوزات قيد المتابعة", icon: "bookmark", href: "/dashboard/reservations", color: "#d97706" },
  ];
  if (me?.isAdmin) {
    tasks.push({
      count: pending.count ?? 0,
      label: "حسابات بانتظار الاعتماد",
      icon: "users",
      href: "/admin/team",
      color: "#dc2626",
    });
  }
  const active = tasks.filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  const stats = [
    { label: "وحدات متاحة", value: availUnits.count ?? 0, href: "/dashboard/search" },
    { label: "حجوزات قيد المتابعة", value: openRes.count ?? 0, href: "/dashboard/reservations" },
    { label: "عروضي النشطة", value: listingsActive.count ?? 0, href: "/dashboard/listings" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-1">أهلًا، {name} 👋</h1>
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
        ملخّص يومك وأهمّ ما يحتاج إجراءً.
      </p>

      {/* مهامّ اليوم */}
      <h2 className="text-base font-bold mb-3">مهامّ اليوم</h2>
      {active.length === 0 ? (
        <div className="card p-6 text-center mb-6" style={{ color: "var(--muted)" }}>
          🎉 لا مهامّ عاجلة. كل شيء تحت السيطرة.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {active.map((t) => (
            <Link
              key={t.label + t.href}
              href={t.href}
              className="card p-4 no-underline flex items-center gap-3"
              style={{ color: "var(--text)" }}
            >
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${t.color} 15%, transparent)`, color: t.color }}
              >
                <Icon name={t.icon} size={22} />
              </span>
              <span className="flex-1 font-bold">{t.label}</span>
              <span
                className="badge text-base font-extrabold"
                style={{ background: t.color, color: "#fff", minWidth: 30, textAlign: "center" }}
              >
                {t.count}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* نظرة سريعة */}
      <h2 className="text-base font-bold mb-3">نظرة سريعة</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card p-4 text-center no-underline"
            style={{ color: "var(--text)" }}
          >
            <div className="text-2xl font-extrabold" style={{ color: "var(--brand)" }}>
              {s.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      {/* إجراءات سريعة */}
      <h2 className="text-base font-bold mb-3">إجراءات سريعة</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickAction href="/dashboard/search" icon="search" label="بحث ذكي" />
        <QuickAction href="/dashboard/inventory" icon="grid" label="المخزون" />
        <QuickAction href="/dashboard/referrals" icon="gift" label="مشاركة الكتالوج" />
        <QuickAction href="/explore" icon="building" label="استكشف العروض" />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="card p-4 no-underline flex flex-col items-center gap-2 text-center"
      style={{ color: "var(--text)" }}
    >
      <span style={{ color: "var(--brand)" }}>
        <Icon name={icon} size={24} />
      </span>
      <span className="text-sm font-bold">{label}</span>
    </Link>
  );
}
