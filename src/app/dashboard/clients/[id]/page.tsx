import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientUnits, type ClientUnitRow } from "@/components/ClientUnits";
import type { Client } from "@/lib/inventory-types";

export default async function ClientDetailPage({
  params,
}: PageProps<"/dashboard/clients/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: cu }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("client_units")
      .select(
        "id, status, unit:units(unit_no, price, status, model:unit_models(bedrooms, area), project:projects(name))",
      )
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const c = client as Client | null;
  if (!c) notFound();

  return (
    <div className="max-w-[820px]">
      <Link href="/dashboard/clients" className="text-sm" style={{ color: "var(--brand)" }}>
        ‹ كل العملاء
      </Link>
      <h1 className="text-2xl font-extrabold mt-2 mb-1">{c.name}</h1>
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
        {c.phone && <span style={{ direction: "ltr" }}>{c.phone}</span>}
        {c.budget != null && (
          <span> · ميزانية {Number(c.budget).toLocaleString("en-US")} ر.س</span>
        )}
      </p>
      {c.notes && (
        <div className="card p-3 mb-5 text-sm" style={{ color: "var(--muted)" }}>
          {c.notes}
        </div>
      )}

      <h2 className="text-base font-bold mb-3">الوحدات المعروضة عليه</h2>
      <ClientUnits initial={(cu as unknown as ClientUnitRow[]) ?? []} />

      <p className="text-sm mt-4" style={{ color: "var(--muted)" }}>
        أضِف وحدات لهذا العميل من صفحة{" "}
        <Link href="/dashboard/search" style={{ color: "var(--brand)" }}>
          البحث
        </Link>{" "}
        عبر زر «أضف لعميل».
      </p>
    </div>
  );
}
