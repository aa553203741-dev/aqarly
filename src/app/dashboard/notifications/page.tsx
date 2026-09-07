import { createClient } from "@/lib/supabase/server";
import { NotificationsList, type Notif } from "@/components/NotificationsList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-[620px]">
      <h1 className="text-2xl font-extrabold mt-0 mb-5">الإشعارات</h1>
      <NotificationsList initial={(data as Notif[]) ?? []} />
    </div>
  );
}
