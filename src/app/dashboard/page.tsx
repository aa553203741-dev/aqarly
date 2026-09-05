import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function OverviewPage() {
  const supabase = await createClient();

  const [leadsNew, leadsProgress, leadsDone, listingsActive] =
    await Promise.all([
      supabase
        .from("client_leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "new"),
      supabase
        .from("client_leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_progress"),
      supabase
        .from("client_leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "done"),
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
    ]);

  const stats = [
    { label: "طلبات جديدة", value: leadsNew.count ?? 0, color: "#2563eb", href: "/dashboard/leads" },
    { label: "قيد المتابعة", value: leadsProgress.count ?? 0, color: "#d97706", href: "/dashboard/leads" },
    { label: "صفقات مكتملة", value: leadsDone.count ?? 0, color: "#16a34a", href: "/dashboard/leads" },
    { label: "عروض متاحة", value: listingsActive.count ?? 0, color: "var(--brand)", href: "/dashboard/listings" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-5">نظرة عامة</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card p-4 no-underline"
            style={{ color: "var(--text)" }}
          >
            <div className="text-3xl font-extrabold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="text-base font-bold mt-0 mb-2">شارك كودك مع عملائك</h2>
        <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
          كل عميل يدخل كودك يصلك طلبه مباشرة في «طلبات العملاء».
        </p>
        <Link href="/dashboard/referrals" className="btn btn-primary">
          عرض كودي ورابط المشاركة
        </Link>
      </div>
    </div>
  );
}
