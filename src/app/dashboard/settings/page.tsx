import Link from "next/link";
import { getMe } from "@/lib/me";
import { SettingsForm } from "@/components/SettingsForm";
import type { Profile } from "@/lib/types";

export default async function SettingsPage() {
  const me = await getMe();
  const data = me?.profile ?? null;
  const isAdmin = me?.isAdmin ?? false;

  const links: { href: string; icon: string; label: string; desc: string }[] = [
    {
      href: "/dashboard/upgrade",
      icon: "★",
      label: "الاشتراك",
      desc: "خطتك الحالية والترقية",
    },
  ];
  if (isAdmin) {
    links.push(
      { href: "/admin", icon: "🛠", label: "لوحة الأدمن", desc: "إدارة المستخدمين والإعدادات" },
      { href: "/admin/analytics", icon: "📈", label: "التحليلات", desc: "المخزون والمبيعات والعمولات" },
      { href: "/admin/revenue", icon: "📊", label: "الإيرادات", desc: "المدفوعات والاشتراكات" },
    );
  }

  return (
    <div className="max-w-[520px]">
      <h1 className="text-2xl font-extrabold mt-0 mb-5">الإعدادات</h1>

      <SettingsForm profile={data as Profile} />

      <h2 className="text-base font-bold mt-7 mb-3">إدارة الحساب</h2>
      <div className="flex flex-col gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="card p-4 flex items-center gap-3 no-underline"
            style={{ color: "var(--text)" }}
          >
            <span className="text-xl">{l.icon}</span>
            <span className="flex-1">
              <span className="font-bold block">{l.label}</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {l.desc}
              </span>
            </span>
            <span style={{ color: "var(--muted)" }}>‹</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
