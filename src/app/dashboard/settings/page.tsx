import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/SettingsForm";
import type { Profile } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="max-w-[480px]">
      <h1 className="text-2xl font-extrabold mt-0 mb-5">الإعدادات</h1>
      <SettingsForm profile={data as Profile} />
    </div>
  );
}
