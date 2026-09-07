"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type Notif = {
  id: string;
  type: string | null;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

const icon: Record<string, string> = {
  reservation: "🔖",
  deal_closed: "✅",
  commission_paid: "💰",
};

export function NotificationsList({ initial }: { initial: Notif[] }) {
  const [rows] = useState(initial);

  // تحديد الكل كمقروء عند فتح الصفحة
  useEffect(() => {
    const unread = initial.filter((n) => !n.read).map((n) => n.id);
    if (unread.length === 0) return;
    const supabase = createClient();
    supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unread)
      .then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
        لا إشعارات بعد.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((n) => {
        const inner = (
          <div
            className="card p-4 flex items-start gap-3"
            style={{
              borderColor: n.read ? "var(--border)" : "var(--brand)",
              borderWidth: n.read ? 1 : 2,
            }}
          >
            <span className="text-xl">{icon[n.type ?? ""] ?? "🔔"}</span>
            <div className="flex-1">
              <div className="font-bold text-sm">{n.title}</div>
              {n.body && (
                <div className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                  {n.body}
                </div>
              )}
              <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {new Date(n.created_at).toLocaleString("ar-SA")}
              </div>
            </div>
          </div>
        );
        return n.link ? (
          <Link key={n.id} href={n.link} className="no-underline" style={{ color: "var(--text)" }}>
            {inner}
          </Link>
        ) : (
          <div key={n.id}>{inner}</div>
        );
      })}
    </div>
  );
}
