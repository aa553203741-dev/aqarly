"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NotificationsBell() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("read", false);
        if (alive) setCount(count ?? 0);
      } catch {
        /* تجاهل */
      }
    })();
    return () => {
      alive = false;
    };
    // يُعاد الجلب عند كل تنقّل (لتحديث العدّاد بعد قراءة الإشعارات)
  }, [pathname]);

  return (
    <Link
      href="/dashboard/notifications"
      className="relative inline-flex items-center justify-center"
      aria-label="الإشعارات"
      style={{ width: 34, height: 34 }}
    >
      <span className="text-xl">🔔</span>
      {count > 0 && (
        <span
          className="absolute -top-0.5 -left-0.5 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{
            background: "var(--danger)",
            color: "#fff",
            minWidth: 16,
            height: 16,
            padding: "0 3px",
          }}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
