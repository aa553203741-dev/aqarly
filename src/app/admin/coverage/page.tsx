import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { Logo } from "@/components/Logo";
import { CoverageManager, type CoverageData } from "@/components/CoverageManager";
import type { District } from "@/lib/inventory-types";

export default async function CoveragePage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.isAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: marketers }, { data: districts }, { data: cov }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("role", ["marketer", "staff", "viewer", "broker"])
        .order("full_name"),
      supabase.from("districts").select("*").order("city"),
      supabase.from("marketer_coverage").select("marketer_id, district_id"),
    ]);

  const data: CoverageData = {
    marketers: (marketers as { id: string; full_name: string | null; email: string | null }[]) ?? [],
    districts: (districts as District[]) ?? [],
    coverage: (cov as { marketer_id: string; district_id: string }[]) ?? [],
  };

  return (
    <div className="flex-1 w-full max-w-[1000px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Logo size={30} />
        <Link href="/admin" className="btn btn-ghost text-sm">
          ← لوحة الأدمن
        </Link>
      </div>
      <h1 className="text-2xl font-extrabold mt-0 mb-1">التغطية الجغرافية</h1>
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
        خصّص أحياءً لكل مسوّق. بلا تخصيص = يرى كل الأحياء.
      </p>
      <CoverageManager data={data} />
    </div>
  );
}
