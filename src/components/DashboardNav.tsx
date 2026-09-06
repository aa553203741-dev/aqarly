"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import type { Plan } from "@/lib/types";

const LINKS = [
  { href: "/dashboard", label: "نظرة عامة", exact: true },
  { href: "/dashboard/inventory", label: "التغطية" },
  { href: "/dashboard/search", label: "بحث" },
  { href: "/dashboard/reservations", label: "حجوزاتي" },
  { href: "/dashboard/projects", label: "المشاريع" },
  { href: "/dashboard/developers", label: "المطوّرون" },
  { href: "/dashboard/leads", label: "طلبات العملاء" },
  { href: "/dashboard/listings", label: "عروضي" },
  { href: "/dashboard/matching", label: "المطابقة" },
  { href: "/dashboard/reports", label: "التقارير" },
  { href: "/dashboard/referrals", label: "الدعوات" },
  { href: "/dashboard/settings", label: "الإعدادات" },
];

export function DashboardNav({
  name,
  plan,
  isAdmin,
  isStaff = false,
}: {
  name: string;
  plan: Plan;
  isAdmin: boolean;
  isStaff?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const links = [...LINKS];
  if (isStaff || isAdmin) {
    const i = links.findIndex((l) => l.href === "/dashboard/reservations");
    links.splice(i + 1, 0, { href: "/dashboard/deals", label: "المعاملات" });
  }
  // «الاشتراك» و«لوحة الأدمن» أصبحا داخل «الإعدادات»

  return (
    <header
      className="no-print w-full border-b sticky top-0 z-10"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="max-w-[1000px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="no-underline">
            <Logo size={32} />
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="badge"
              style={{
                background: plan === "premium" ? "var(--gold)" : "var(--brand-soft)",
                color: plan === "premium" ? "#fff" : "var(--brand-dark)",
              }}
            >
              {plan === "premium" ? "★ مميّز" : "مجاني"}
            </span>
            <span className="text-sm font-bold hidden sm:inline">{name}</span>
            <button onClick={signOut} className="btn btn-ghost !py-1.5 !px-3 text-sm">
              خروج
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px">
          {links.map((l) => {
            const active = l.exact
              ? pathname === l.href
              : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="no-underline whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-bold"
                style={{
                  background: active ? "var(--brand-soft)" : "transparent",
                  color: active ? "var(--brand-dark)" : "var(--muted)",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
