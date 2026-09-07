"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { InstallButton } from "@/components/InstallButton";
import { NotificationsBell } from "@/components/NotificationsBell";
import type { Plan } from "@/lib/types";

type NavLink = { href: string; label: string; icon: string; exact?: boolean };
type NavSection = { title: string | null; links: NavLink[] };

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
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const dealsLinks: NavLink[] = [
    { href: "/dashboard/reservations", label: "حجوزاتي", icon: "bookmark" },
  ];
  if (isStaff || isAdmin) {
    dealsLinks.push({ href: "/dashboard/deals", label: "المعاملات", icon: "briefcase" });
  }

  const sections: NavSection[] = [
    {
      title: null,
      links: [{ href: "/dashboard", label: "نظرة عامة", icon: "home", exact: true }],
    },
    {
      title: "المخزون",
      links: [
        { href: "/dashboard/inventory", label: "التغطية", icon: "grid" },
        { href: "/dashboard/search", label: "بحث", icon: "search" },
        { href: "/dashboard/map", label: "الخريطة", icon: "pin" },
        { href: "/dashboard/projects", label: "المشاريع", icon: "building" },
        { href: "/dashboard/developers", label: "المطوّرون", icon: "building2" },
      ],
    },
    { title: "الصفقات", links: dealsLinks },
    {
      title: "العملاء",
      links: [
        { href: "/dashboard/clients", label: "عملائي", icon: "users" },
        { href: "/dashboard/leads", label: "طلبات العملاء", icon: "inbox" },
        { href: "/dashboard/listings", label: "عروضي", icon: "tag" },
        { href: "/dashboard/matching", label: "المطابقة", icon: "target" },
      ],
    },
    {
      title: "أخرى",
      links: [
        { href: "/dashboard/reports", label: "التقارير", icon: "chart" },
        { href: "/dashboard/referrals", label: "الدعوات", icon: "gift" },
        { href: "/dashboard/settings", label: "الإعدادات", icon: "settings" },
      ],
    },
  ];

  const isActive = (l: NavLink) =>
    l.exact ? pathname === l.href : pathname.startsWith(l.href);

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col p-2">
      {sections.map((sec, si) => (
        <div key={si} className={si > 0 ? "mt-3" : ""}>
          {sec.title && (
            <div
              className="px-3 pb-1 text-[11px] font-bold tracking-wide"
              style={{ color: "var(--muted)", opacity: 0.7 }}
            >
              {sec.title}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {sec.links.map((l) => {
              const active = isActive(l);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={onClick}
                  className="no-underline flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold"
                  style={{
                    background: active ? "var(--brand-soft)" : "transparent",
                    color: active ? "var(--brand-dark)" : "var(--muted)",
                  }}
                >
                  <span className="w-6 flex items-center justify-center">
                    <Icon name={l.icon} size={19} />
                  </span>
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const UserBox = () => (
    <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="badge"
          style={{
            background: plan === "premium" ? "var(--gold)" : "var(--brand-soft)",
            color: plan === "premium" ? "#fff" : "var(--brand-dark)",
          }}
        >
          {plan === "premium" ? "★ مميّز" : "مجاني"}
        </span>
        <span className="text-sm font-bold truncate">{name}</span>
      </div>
      <div className="mb-2">
        <InstallButton />
      </div>
      <button onClick={signOut} className="btn btn-ghost w-full !py-1.5 text-sm">
        تسجيل الخروج
      </button>
    </div>
  );

  return (
    <>
      {/* ===== شريط جانبي ثابت على اليمين (سطح المكتب) ===== */}
      <aside
        className="no-print hidden sm:flex flex-col fixed top-0 right-0 h-full w-56 border-l z-20"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <Link href="/dashboard" className="no-underline">
            <Logo size={30} />
          </Link>
          <NotificationsBell />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavItems />
        </div>
        <UserBox />
      </aside>

      {/* ===== شريط علوي للجوال ===== */}
      <header
        className="no-print sm:hidden sticky top-0 z-20 border-b flex items-center justify-between px-4 h-14"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <Link href="/dashboard" className="no-underline">
          <Logo size={28} />
        </Link>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <button
            onClick={() => setOpen(true)}
            aria-label="القائمة"
            className="text-2xl leading-none"
            style={{ color: "var(--text)" }}
          >
            ☰
          </button>
        </div>
      </header>

      {/* ===== درج الجوال المنزلق ===== */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,.45)" }} />
          <div
            className="absolute top-0 right-0 h-full w-64 flex flex-col"
            style={{ background: "var(--surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <Logo size={28} />
              <button onClick={() => setOpen(false)} className="text-xl">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavItems onClick={() => setOpen(false)} />
            </div>
            <UserBox />
          </div>
        </div>
      )}
    </>
  );
}
