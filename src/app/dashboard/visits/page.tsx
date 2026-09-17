import { createClient } from "@/lib/supabase/server";
import { VisitsList } from "@/components/VisitsList";
import type { VisitBooking } from "@/lib/types";

export default async function VisitsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("visit_bookings")
    .select("*, unit:units(unit_no), project:projects(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-1">طلبات الزيارة</h1>
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
        طلبات العملاء لزيارة العقارات من روابط المشاركة. أكّد الموعد وتابع حالته.
      </p>
      <VisitsList initial={(data as VisitBooking[]) ?? []} />
    </div>
  );
}
