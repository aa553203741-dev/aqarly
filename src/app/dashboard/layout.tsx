import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const me = await getMe();
  if (!me) redirect("/login");
  const p = me.profile;

  return (
    <div className="flex-1">
      <DashboardNav
        name={p?.full_name || p?.email || "وسيط"}
        plan={p?.plan || "free"}
        isAdmin={me.isAdmin}
        isStaff={me.canProcessPayments || me.canCloseDeals}
      />
      <main className="sm:mr-56 min-h-screen">
        <div className="w-full max-w-[1000px] mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
