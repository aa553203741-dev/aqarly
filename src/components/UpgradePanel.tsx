"use client";

import { useState } from "react";
import type { Plan } from "@/lib/types";

export function UpgradePanel({
  plan,
  monthly,
  yearly,
}: {
  plan: Plan;
  monthly: number;
  yearly: number;
}) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startPayment() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "فشل الدفع");
      }
      // توجيه إلى صفحة الدفع المُستضافة لدى Moyasar
      window.location.href = data.url;
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "تعذّر بدء الدفع");
    }
  }

  if (plan === "premium") {
    return (
      <div className="card p-7 text-center">
        <div className="text-4xl mb-2">★</div>
        <h2 className="text-lg font-bold m-0">أنت مشترك في الخطة المميّزة</h2>
        <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
          تستمتع بكل الميزات، بما فيها التقارير والتصدير.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <PlanCard
          title="مجاني"
          price="0"
          period="دائمًا"
          current
          features={["طلبات العملاء", "إدارة العروض", "المطابقة", "كود المشاركة"]}
        />
        <PlanCard
          title="مميّز"
          price={billing === "monthly" ? String(monthly) : String(yearly)}
          period={billing === "monthly" ? "شهريًا" : "سنويًا"}
          highlight
          features={[
            "كل مزايا المجاني",
            "تقارير Excel و PDF",
            "أولوية الدعم",
            "بلا حدود",
          ]}
        />
      </div>

      <div className="flex gap-2 justify-center mb-5">
        <Toggle active={billing === "monthly"} onClick={() => setBilling("monthly")}>
          شهري
        </Toggle>
        <Toggle active={billing === "yearly"} onClick={() => setBilling("yearly")}>
          سنوي (توفير)
        </Toggle>
      </div>

      <button
        onClick={startPayment}
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading
          ? "جارِ التحويل للدفع..."
          : `الدفع والاشتراك — ${billing === "monthly" ? monthly : yearly} ر.س`}
      </button>
      {error && (
        <p className="text-center text-sm mt-2" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <p className="text-center text-xs mt-3" style={{ color: "var(--muted)" }}>
        دفع آمن عبر Moyasar — mada، Apple Pay، والبطاقات. يُفعّل اشتراكك تلقائيًا بعد الدفع.
      </p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  period,
  features,
  highlight,
  current,
}: {
  title: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
  current?: boolean;
}) {
  return (
    <div
      className="card p-5"
      style={{
        borderColor: highlight ? "var(--brand)" : "var(--border)",
        borderWidth: highlight ? 2 : 1,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold">{title}</span>
        {current && (
          <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
            الحالية
          </span>
        )}
      </div>
      <div className="mt-2">
        <span className="text-3xl font-extrabold">{price}</span>
        <span className="text-sm" style={{ color: "var(--muted)" }}> ر.س / {period}</span>
      </div>
      <ul className="mt-3 mb-0 pr-4 text-sm flex flex-col gap-1" style={{ color: "var(--muted)" }}>
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-lg text-sm font-bold"
      style={{
        background: active ? "var(--brand)" : "var(--surface)",
        color: active ? "#fff" : "var(--muted)",
        border: "1px solid var(--border)",
      }}
    >
      {children}
    </button>
  );
}
