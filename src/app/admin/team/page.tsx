import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { Logo } from "@/components/Logo";
import { TeamManager, type TeamMember } from "@/components/TeamManager";
import { InviteCodes, type Invite } from "@/components/InviteCodes";

export default async function TeamPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.isAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: profiles }, { data: perms }, { data: invites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .order("created_at", { ascending: false }),
    supabase.from("user_permissions").select("*"),
    supabase.from("invite_codes").select("*").order("created_at", { ascending: false }),
  ]);

  const permMap = new Map(
    ((perms as Record<string, unknown>[]) ?? []).map((p) => [p.user_id as string, p]),
  );

  const members: TeamMember[] = (
    (profiles as { id: string; email: string | null; full_name: string | null; role: string }[]) ??
    []
  ).map((p) => {
    const pm = (permMap.get(p.id) ?? {}) as Record<string, boolean>;
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role,
      can_reserve: pm.can_reserve ?? true,
      can_process_payments: pm.can_process_payments ?? false,
      can_close_deals: pm.can_close_deals ?? false,
      can_manage_inventory: pm.can_manage_inventory ?? false,
      can_view_all_commissions: pm.can_view_all_commissions ?? false,
    };
  });

  return (
    <div className="flex-1 w-full max-w-[1000px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Logo size={30} />
        <Link href="/admin" className="btn btn-ghost text-sm">
          ← لوحة الأدمن
        </Link>
      </div>
      <h1 className="text-2xl font-extrabold mt-0 mb-1">الفريق والصلاحيات</h1>

      <h2 className="text-base font-bold mt-4 mb-3">أكواد الدعوة</h2>
      <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
        ولّد كودًا وأرسله للمسوّق ليسجّل به فينضم بالدور الصحيح تلقائيًا.
      </p>
      <InviteCodes initial={(invites as Invite[]) ?? []} />

      <h2 className="text-base font-bold mt-7 mb-3">الأعضاء والصلاحيات</h2>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        عيّن دور كل مستخدم وصلاحياته الدقيقة. الأدمن يملك كل الصلاحيات تلقائيًا.
      </p>
      <TeamManager initial={members} meId={me.userId} />
    </div>
  );
}
