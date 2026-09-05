import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import type { Profile } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const p = (profile as Profile | null) ?? null;

  return (
    <div className="flex-1 flex flex-col">
      <DashboardNav
        name={p?.full_name || p?.email || "وسيط"}
        plan={p?.plan || "free"}
        isAdmin={p?.role === "admin"}
      />
      <div className="flex-1 w-full max-w-[1000px] mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
