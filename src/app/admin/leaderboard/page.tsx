import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { Logo } from "@/components/Logo";

type Res = {
  marketer_id: string | null;
  stage: string;
  commission_amount: number | null;
  commission_status: string;
};
type Prof = { id: string; full_name: string | null; email: string | null };

type Agg = {
  id: string;
  name: string;
  closed: number;
  active: number;
  total: number;
  commission: number; // مستحقّة + مدفوعة
  paid: number;
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const MEDAL = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.isAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: res }, { data: profs }] = await Promise.all([
    supabase
      .from("reservations")
      .select("marketer_id, stage, commission_amount, commission_status"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const nameOf = new Map(
    ((profs as Prof[]) ?? []).map((p) => [p.id, p.full_name || p.email || "مسوّق"]),
  );

  const map = new Map<string, Agg>();
  for (const r of (res as Res[]) ?? []) {
    if (!r.marketer_id) continue;
    let a = map.get(r.marketer_id);
    if (!a) {
      a = {
        id: r.marketer_id,
        name: nameOf.get(r.marketer_id) || "مسوّق",
        closed: 0,
        active: 0,
        total: 0,
        commission: 0,
        paid: 0,
      };
      map.set(r.marketer_id, a);
    }
    a.total++;
    if (r.stage === "closed") a.closed++;
    else if (r.stage !== "cancelled") a.active++;
    const amt = Number(r.commission_amount) || 0;
    if (r.commission_status === "paid") {
      a.paid += amt;
      a.commission += amt;
    } else if (r.commission_status === "earned") {
      a.commission += amt;
    }
  }

  const rows = [...map.values()].sort(
    (x, y) => y.closed - x.closed || y.commission - x.commission,
  );

  return (
    <div className="flex-1 w-full max-w-[1000px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Logo size={30} />
        <Link href="/admin" className="btn btn-ghost text-sm">
          ← لوحة الأدمن
        </Link>
      </div>
      <h1 className="text-2xl font-extrabold mt-0 mb-1">🏆 ترتيب المسوّقين</h1>
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
        مرتّب حسب الصفقات المغلقة ثم إجمالي العمولة.
      </p>

      {rows.length === 0 ? (
        <div className="card p-10 text-center" style={{ color: "var(--muted)" }}>
          لا حجوزات بعد لعرض الترتيب.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r, i) => (
            <div
              key={r.id}
              className="card p-4 flex items-center gap-3"
              style={
                i < 3
                  ? { borderColor: "var(--brand)", borderWidth: 2 }
                  : undefined
              }
            >
              <div
                className="text-xl font-extrabold w-9 text-center shrink-0"
                style={{ color: "var(--muted)" }}
              >
                {MEDAL[i] ?? i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{r.name}</div>
                <div className="flex gap-2 flex-wrap mt-1 text-xs">
                  <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
                    {r.active} نشطة
                  </span>
                  <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
                    {r.total} إجمالي
                  </span>
                  <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
                    عمولة {fmt(r.commission)} ر.س
                  </span>
                  {r.paid > 0 && (
                    <span className="badge" style={{ background: "#16a34a", color: "#fff" }}>
                      مدفوع {fmt(r.paid)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-2xl font-extrabold" style={{ color: "var(--brand)" }}>
                  {r.closed}
                </div>
                <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                  صفقة مغلقة
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
