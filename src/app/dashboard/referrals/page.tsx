import { createClient } from "@/lib/supabase/server";
import { ShareCode } from "@/components/ShareCode";
import type { Referral } from "@/lib/types";

const STATUS_LABEL: Record<Referral["status"], string> = {
  pending: "بانتظار الترقية",
  earned: "مكافأة مستحقة",
  rewarded: "تمت المكافأة",
};

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: codeRow }, { data: refs }] = await Promise.all([
    supabase
      .from("broker_codes")
      .select("code")
      .eq("user_id", user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const code = (codeRow as { code: string } | null)?.code ?? "";
  const referrals = (refs as Referral[]) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-5">كودي والدعوات</h1>

      <ShareCode code={code} />

      <h2 className="text-base font-bold mt-7 mb-3">دعواتي</h2>
      {referrals.length === 0 ? (
        <div className="card p-6 text-center" style={{ color: "var(--muted)" }}>
          لا توجد دعوات مسجّلة بعد.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {referrals.map((r) => (
            <div
              key={r.id}
              className="card p-3 flex items-center justify-between gap-2 flex-wrap text-sm"
            >
              <span className="font-bold">{r.referred_email ?? "وسيط جديد"}</span>
              <span
                className="badge"
                style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
              >
                {STATUS_LABEL[r.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
