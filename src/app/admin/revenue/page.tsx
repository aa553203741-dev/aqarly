import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import type { Profile } from "@/lib/types";

type Payment = {
  id: string;
  user_id: string | null;
  amount: number; // هللات
  billing: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
};

const sar = (halalas: number) =>
  (halalas / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default async function RevenuePage() {
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
  if ((me as { role: string } | null)?.role !== "admin") redirect("/dashboard");

  const [{ data: paymentsData }, { data: brokers }, premiumCount] =
    await Promise.all([
      supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email"),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("plan", "premium"),
    ]);

  const payments = (paymentsData as Payment[]) ?? [];
  const paid = payments.filter((p) => p.status === "paid");
  const byId = new Map(
    ((brokers as Pick<Profile, "id" | "full_name" | "email">[]) ?? []).map((b) => [
      b.id,
      b,
    ]),
  );

  const now = new Date();
  const thisMonth = paid.filter((p) => {
    const d = new Date(p.paid_at ?? p.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const totalRevenue = paid.reduce((s, p) => s + p.amount, 0);
  const monthRevenue = thisMonth.reduce((s, p) => s + p.amount, 0);

  // إيراد آخر 6 أشهر
  const months: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const total = paid
      .filter((p) => {
        const pd = new Date(p.paid_at ?? p.created_at);
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
      })
      .reduce((s, p) => s + p.amount, 0);
    months.push({
      label: d.toLocaleDateString("ar-SA", { month: "short" }),
      total,
    });
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.total));

  return (
    <div className="flex-1 w-full max-w-[1000px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Logo size={32} />
        <Link href="/admin" className="btn btn-ghost text-sm">
          ← لوحة الأدمن
        </Link>
      </div>

      <h1 className="text-2xl font-extrabold mt-0 mb-5">الإيرادات</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Stat label="إجمالي الإيراد" value={`${sar(totalRevenue)} ر.س`} big />
        <Stat label="إيراد هذا الشهر" value={`${sar(monthRevenue)} ر.س`} />
        <Stat label="اشتراكات نشطة" value={String(premiumCount.count ?? 0)} />
        <Stat label="عمليات مدفوعة" value={String(paid.length)} />
      </div>

      <div className="card p-5 mb-6">
        <h2 className="text-base font-bold mt-0 mb-4">الإيراد الشهري (آخر 6 أشهر)</h2>
        <div className="flex items-end gap-3 h-40">
          {months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs font-bold" style={{ color: "var(--muted)" }}>
                {m.total > 0 ? sar(m.total) : ""}
              </div>
              <div
                className="w-full rounded-t-lg"
                style={{
                  height: `${(m.total / maxMonth) * 100}%`,
                  minHeight: m.total > 0 ? 6 : 2,
                  background:
                    m.total > 0 ? "var(--brand)" : "var(--border)",
                  transition: "height .3s",
                }}
                title={`${sar(m.total)} ر.س`}
              />
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-base font-bold mb-3">سجل المدفوعات</h2>
      {payments.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد مدفوعات بعد.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["الوسيط", "المبلغ", "الاشتراك", "الحالة", "التاريخ"].map((h) => (
                  <th
                    key={h}
                    className="text-right p-3 font-bold whitespace-nowrap"
                    style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const b = p.user_id ? byId.get(p.user_id) : null;
                return (
                  <tr key={p.id}>
                    <td className="p-3">{b?.full_name || b?.email || "—"}</td>
                    <td className="p-3 font-bold whitespace-nowrap">
                      {sar(p.amount)} ر.س
                    </td>
                    <td className="p-3">
                      {p.billing === "yearly" ? "سنوي" : "شهري"}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                      {new Date(p.paid_at ?? p.created_at).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="card p-4">
      <div
        className="font-extrabold"
        style={{ color: "var(--brand)", fontSize: big ? 26 : 22 }}
      >
        {value}
      </div>
      <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    paid: { label: "مدفوع", bg: "#dcfce7", fg: "#166534" },
    initiated: { label: "قيد الدفع", bg: "#fef9c3", fg: "#854d0e" },
    failed: { label: "فشل", bg: "#fde8e8", fg: "#991b1b" },
  };
  const s = map[status] ?? { label: status, bg: "#f1f5f9", fg: "#475569" };
  return (
    <span className="badge" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}
