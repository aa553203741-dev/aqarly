import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { Logo } from "@/components/Logo";
import { InventoryReports } from "@/components/InventoryReports";

export default async function InventoryReportsPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.isAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: units }, { data: resData }] = await Promise.all([
    supabase
      .from("units_search")
      .select(
        "unit_no, floor, price, discount_price, status, bedrooms, area, bathrooms, model_name, project_name, developer_name, city, district_name, commission_amount",
      ),
    supabase
      .from("reservations")
      .select(
        "stage, agreed_price, commission_amount, commission_status, reserved_at, client_name, unit:units(unit_no), project:projects(name), marketer:profiles!reservations_marketer_id_fkey(full_name, email)",
      )
      .order("created_at", { ascending: false }),
  ]);

  type R = {
    stage: string;
    agreed_price: number | null;
    commission_amount: number | null;
    commission_status: string;
    reserved_at: string;
    client_name: string | null;
    unit?: { unit_no: string } | null;
    project?: { name: string } | null;
    marketer?: { full_name: string | null; email: string | null } | null;
  };
  const reservations = ((resData as unknown as R[]) ?? []).map((r) => ({
    project_name: r.project?.name ?? "",
    unit_no: r.unit?.unit_no ?? "",
    marketer: r.marketer?.full_name || r.marketer?.email || "",
    client_name: r.client_name ?? "",
    stage: r.stage,
    agreed_price: r.agreed_price,
    commission_amount: r.commission_amount,
    commission_status: r.commission_status,
    reserved_at: r.reserved_at,
  }));

  return (
    <div className="flex-1 w-full max-w-[1000px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 no-print">
        <Logo size={30} />
        <Link href="/admin" className="btn btn-ghost text-sm">
          ← لوحة الأدمن
        </Link>
      </div>
      <InventoryReports
        units={(units as InventoryUnit[]) ?? []}
        reservations={reservations}
      />
    </div>
  );
}

export type InventoryUnit = {
  unit_no: string;
  floor: number | null;
  price: number | null;
  discount_price: number | null;
  status: string;
  bedrooms: number | null;
  area: number | null;
  bathrooms: number | null;
  model_name: string | null;
  project_name: string;
  developer_name: string | null;
  city: string | null;
  district_name: string | null;
  commission_amount: number | null;
};
