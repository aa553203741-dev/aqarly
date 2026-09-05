import { createClient } from "@/lib/supabase/server";
import { UpgradePanel } from "@/components/UpgradePanel";
import type { Profile } from "@/lib/types";

export default async function UpgradePage({
  searchParams,
}: PageProps<"/dashboard/upgrade">) {
  const sp = await searchParams;
  const paymentStatus =
    typeof sp.status === "string" ? sp.status : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user?.id ?? "").maybeSingle(),
    supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["premium_monthly_price", "premium_yearly_price"]),
  ]);

  const p = profile as Profile | null;
  const map = new Map(
    ((settings as { key: string; value: string }[]) ?? []).map((s) => [
      s.key,
      s.value,
    ]),
  );

  return (
    <div className="max-w-[620px]">
      <h1 className="text-2xl font-extrabold mt-0 mb-5">الاشتراك</h1>

      {paymentStatus === "paid" && p?.plan !== "premium" && (
        <div
          className="card p-4 mb-5 text-center"
          style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
        >
          ✅ تم الدفع بنجاح — يُفعّل اشتراكك خلال لحظات. حدّث الصفحة إن لم يتغيّر.
        </div>
      )}
      {paymentStatus === "failed" && (
        <div
          className="card p-4 mb-5 text-center"
          style={{ background: "#fde8e8", color: "var(--danger)" }}
        >
          تعذّر إتمام الدفع. حاول مرة أخرى.
        </div>
      )}

      <UpgradePanel
        plan={p?.plan ?? "free"}
        monthly={Number(map.get("premium_monthly_price") ?? 29)}
        yearly={Number(map.get("premium_yearly_price") ?? 290)}
      />
    </div>
  );
}
