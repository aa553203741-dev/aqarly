"use client";

import { useMemo, useState } from "react";

const fmt = (n: number) =>
  Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "0";

// حاسبة التمويل العقاري — قسط شهري بطريقة الإطفاء المتناقص.
export function HomeCalculator({
  initialPrice = 500000,
  compact = false,
}: {
  initialPrice?: number;
  compact?: boolean;
}) {
  const [price, setPrice] = useState(String(initialPrice));
  const [down, setDown] = useState(String(Math.round(initialPrice * 0.1)));
  const [years, setYears] = useState(25);
  const [rate, setRate] = useState("4.5");

  const p = Math.max(0, Number(price) || 0);
  const d = Math.min(Math.max(0, Number(down) || 0), p);
  const a = Math.max(0, Number(rate) || 0);

  const { loan, monthly, total, profit, downPct } = useMemo(() => {
    const loan = Math.max(0, p - d);
    const r = a / 100 / 12;
    const n = years * 12;
    let monthly = 0;
    if (n > 0) {
      monthly =
        r === 0 ? loan / n : (loan * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    }
    const total = monthly * n;
    return {
      loan,
      monthly,
      total,
      profit: total - loan,
      downPct: p > 0 ? Math.round((d / p) * 100) : 0,
    };
  }, [p, d, a, years]);

  return (
    <div className={compact ? "" : "card p-5"}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="label">سعر العقار (ر.س)</label>
          <input
            className="field"
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ direction: "ltr", textAlign: "right" }}
          />
        </div>

        <div>
          <label className="label">
            الدفعة الأولى (ر.س){" "}
            <span style={{ color: "var(--muted)", fontWeight: 400 }}>
              — {downPct}%
            </span>
          </label>
          <input
            className="field"
            type="number"
            inputMode="numeric"
            value={down}
            onChange={(e) => setDown(e.target.value)}
            style={{ direction: "ltr", textAlign: "right" }}
          />
          <div className="flex gap-2 mt-2">
            {[10, 15, 20, 30].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setDown(String(Math.round((p * pct) / 100)))}
                className="px-3 py-1 rounded-lg text-sm font-bold"
                style={{
                  background: downPct === pct ? "var(--brand)" : "var(--surface)",
                  color: downPct === pct ? "#fff" : "var(--muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">مدة التمويل (سنوات)</label>
            <select
              className="field"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            >
              {[5, 10, 15, 20, 25, 30].map((y) => (
                <option key={y} value={y}>
                  {y} سنة
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">نسبة الربح السنوية %</label>
            <input
              className="field"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              style={{ direction: "ltr", textAlign: "right" }}
            />
          </div>
        </div>

        {/* النتائج */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "var(--brand-soft)" }}
        >
          <div className="text-sm" style={{ color: "var(--brand-dark)" }}>
            القسط الشهري التقديري
          </div>
          <div
            className="text-3xl font-extrabold mt-1"
            style={{ color: "var(--brand)" }}
          >
            {fmt(monthly)} ر.س
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Cell label="مبلغ التمويل" value={fmt(loan)} />
          <Cell label="إجمالي المسدَّد" value={fmt(total)} />
          <Cell label="هامش الربح" value={fmt(profit)} />
        </div>

        <p className="text-xs m-0" style={{ color: "var(--muted)" }}>
          تقدير مبدئي لأغراض المقارنة فقط، وليس عرض تمويل. تختلف الشروط والنِّسب
          حسب الجهة المموّلة وأهليتك.
        </p>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-2.5">
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="font-bold text-sm mt-0.5">{value}</div>
    </div>
  );
}
