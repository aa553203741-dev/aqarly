import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminBrokers } from "@/components/AdminBrokers";
import { AdminUpgrades, type UpgradeRow } from "@/components/AdminUpgrades";
import { Logo } from "@/components/Logo";
import type { Profile } from "@/lib/types";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((me as { role: string } | null)?.role !== "admin") {
    redirect("/dashboard");
  }

  const [{ data: brokers }, leadsCount, listingsCount, { data: upgrades }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("client_leads").select("*", { count: "exact", head: true }),
      supabase.from("listings").select("*", { count: "exact", head: true }),
      supabase
        .from("upgrade_requests")
        .select("id, user_id, billing, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

  const brokerList = (brokers as Profile[]) ?? [];
  const byId = new Map(brokerList.map((b) => [b.id, b]));
  const upgradeRows: UpgradeRow[] = (
    (upgrades as { id: string; user_id: string; billing: string; created_at: string }[]) ?? []
  ).map((u) => ({
    ...u,
    email: byId.get(u.user_id)?.email ?? null,
    full_name: byId.get(u.user_id)?.full_name ?? null,
  }));

  return (
    <div className="flex-1 w-full max-w-[1000px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Logo size={32} />
        <div className="flex gap-2">
          <Link href="/admin/analytics" className="btn btn-primary text-sm">
            📈 التحليلات
          </Link>
          <Link href="/admin/team" className="btn btn-primary text-sm">
            👥 الفريق
          </Link>
          <Link href="/admin/revenue" className="btn btn-primary text-sm">
            📊 الإيرادات
          </Link>
          <Link href="/dashboard" className="btn btn-ghost text-sm">
            ← لوحة الوسيط
          </Link>
        </div>
      </div>

      <h1 className="text-2xl font-extrabold mt-0 mb-5">لوحة الأدمن</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="الوسطاء" value={brokerList.length} />
        <Stat label="إجمالي الطلبات" value={leadsCount.count ?? 0} />
        <Stat label="إجمالي العروض" value={listingsCount.count ?? 0} />
      </div>

      <h2 className="text-base font-bold mb-3">
        طلبات الترقية المعلّقة
        {upgradeRows.length > 0 && (
          <span
            className="badge mr-2"
            style={{ background: "var(--gold)", color: "#fff" }}
          >
            {upgradeRows.length}
          </span>
        )}
      </h2>
      <div className="mb-8">
        <AdminUpgrades initial={upgradeRows} />
      </div>

      <h2 className="text-base font-bold mb-3">إدارة الوسطاء</h2>
      <AdminBrokers initial={brokerList} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-3xl font-extrabold" style={{ color: "var(--brand)" }}>
        {value}
      </div>
      <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}
