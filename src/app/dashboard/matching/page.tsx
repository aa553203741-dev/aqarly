import { createClient } from "@/lib/supabase/server";
import {
  DEAL_TYPES,
  PROPERTY_TYPES,
  labelOf,
} from "@/lib/constants";
import type { ClientLead, Listing } from "@/lib/types";

type Match = { lead: ClientLead; listings: Listing[] };

export default async function MatchingPage() {
  const supabase = await createClient();

  const [{ data: leadsData }, { data: listingsData }] = await Promise.all([
    supabase
      .from("client_leads")
      .select("*")
      .in("status", ["new", "in_progress"]),
    supabase.from("listings").select("*").eq("status", "active"),
  ]);

  const leads = (leadsData as ClientLead[]) ?? [];
  const listings = (listingsData as Listing[]) ?? [];

  const matches: Match[] = leads
    .map((lead) => {
      const matched = listings.filter(
        (li) =>
          li.deal_type === lead.deal_type &&
          li.city === lead.city &&
          (li.property_type === lead.property_type ||
            lead.property_type === "other") &&
          (lead.budget == null ||
            li.price == null ||
            Number(li.price) <= Number(lead.budget) * 1.15),
      );
      return { lead, listings: matched };
    })
    .filter((m) => m.listings.length > 0);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-1">المطابقة الذكية</h1>
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
        نطابق طلبات عملائك المفتوحة مع عروضك المتاحة (نفس المدينة ونوع الطلب
        والعقار، والميزانية ضمن هامش 15%).
      </p>

      {matches.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد مطابقات حاليًا. أضِف عروضًا أو انتظر طلبات جديدة.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map(({ lead, listings }) => (
            <div key={lead.id} className="card p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold">{lead.client_name}</span>
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  يبحث عن {labelOf(PROPERTY_TYPES, lead.property_type)} —{" "}
                  {labelOf(DEAL_TYPES, lead.deal_type)} في {lead.city}
                </span>
                <span
                  className="badge mr-auto"
                  style={{ background: "var(--brand)", color: "#fff" }}
                >
                  {listings.length} تطابق
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {listings.map((li) => (
                  <div
                    key={li.id}
                    className="flex items-center gap-2 flex-wrap text-sm p-2 rounded-lg"
                    style={{ background: "var(--brand-soft)" }}
                  >
                    <span className="font-bold">{li.title}</span>
                    {li.price != null && (
                      <span style={{ color: "var(--brand-dark)" }}>
                        {Number(li.price).toLocaleString("en-US")} ر.س
                      </span>
                    )}
                    {li.district && (
                      <span style={{ color: "var(--muted)" }}>{li.district}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
