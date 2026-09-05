import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReportsPanel } from "@/components/ReportsPanel";
import type { ClientLead, Listing, Profile } from "@/lib/types";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const p = profile as Profile | null;
  const isPremium = p?.plan === "premium";

  if (!isPremium) {
    return (
      <div className="max-w-[520px]">
        <h1 className="text-2xl font-extrabold mt-0 mb-4">التقارير</h1>
        <div className="card p-7 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-lg font-bold m-0">ميزة مميّزة</h2>
          <p className="text-sm mt-2 mb-5" style={{ color: "var(--muted)" }}>
            تصدير التقارير (Excel / PDF) متاح في الخطة المميّزة. رقِّ حسابك
            للوصول إلى تقارير طلبات العملاء وعروضك كاملة.
          </p>
          <Link href="/dashboard/upgrade" className="btn btn-primary">
            الترقية للخطة المميّزة
          </Link>
        </div>
      </div>
    );
  }

  const [{ data: leads }, { data: listings }] = await Promise.all([
    supabase
      .from("client_leads")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ReportsPanel
      leads={(leads as ClientLead[]) ?? []}
      listings={(listings as Listing[]) ?? []}
      brokerName={p?.full_name ?? ""}
    />
  );
}
