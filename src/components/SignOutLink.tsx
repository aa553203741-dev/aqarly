"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// زر خروج مستقل — تستخدمه الصفحات خارج لوحة التحكم (مثل /pending)
// حيث لا يوجد DashboardNav.
export function SignOutLink({ className }: { className?: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={signOut} className={className}>
      تسجيل الخروج
    </button>
  );
}
