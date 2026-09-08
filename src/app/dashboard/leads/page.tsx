import { createClient } from "@/lib/supabase/server";
import { coveredDistrictIds } from "@/lib/me";
import { LeadsTable } from "@/components/LeadsTable";
import type { ClientLead, LeadSuggestion, Listing } from "@/lib/types";
import type { UnitSearchRow } from "@/lib/inventory-types";
import type { PickOption } from "@/components/LeadsTable";

export default async function LeadsPage() {
  const supabase = await createClient();
  const covered = await coveredDistrictIds();

  const { data: leadsData } = await supabase
    .from("client_leads")
    .select("*")
    .order("created_at", { ascending: false });
  const leads = (leadsData as ClientLead[]) ?? [];

  // الاقتراحات الموجودة لهذه الطلبات
  const leadIds = leads.map((l) => l.id);
  const suggestionsQ =
    leadIds.length > 0
      ? supabase
          .from("lead_suggestions")
          .select("*")
          .in("lead_id", leadIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as LeadSuggestion[] });

  // الوحدات المتاحة من المخزون (ضمن تغطية المسوّق)
  let unitsQ = supabase
    .from("units_search")
    .select(
      "id, unit_no, price, discount_price, bedrooms, area, project_name, district_name, city, district_id",
    )
    .eq("status", "available")
    .order("price", { ascending: true })
    .limit(300);
  if (covered) unitsQ = unitsQ.in("district_id", covered);

  const [{ data: sugg }, { data: unitsData }, { data: listingsData }] =
    await Promise.all([
      suggestionsQ,
      unitsQ,
      supabase
        .from("listings")
        .select("id, title, price, city, district, property_type")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

  const unitOptions: PickOption[] = (
    (unitsData as Partial<UnitSearchRow>[]) ?? []
  ).map((u) => ({
    kind: "unit",
    ref_id: u.id!,
    title: `${u.project_name ?? "مشروع"} — وحدة ${u.unit_no ?? ""}`.trim(),
    subtitle: [
      u.district_name || u.city,
      u.bedrooms != null ? `${u.bedrooms} غرف` : null,
      u.area != null ? `${u.area} م²` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    price: (u.discount_price ?? u.price) ?? null,
  }));

  const listingOptions: PickOption[] = (
    (listingsData as (Pick<Listing, "id" | "title" | "price" | "city" | "district" | "property_type">)[]) ??
    []
  ).map((li) => ({
    kind: "listing",
    ref_id: li.id,
    title: li.title,
    subtitle: [li.city, li.district].filter(Boolean).join(" — "),
    price: li.price ?? null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-5">طلبات العملاء</h1>
      <LeadsTable
        initial={leads}
        suggestions={(sugg as LeadSuggestion[]) ?? []}
        unitOptions={unitOptions}
        listingOptions={listingOptions}
      />
    </div>
  );
}
