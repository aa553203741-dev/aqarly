"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RESERVATION_STAGE } from "@/lib/inventory-constants";
import type { Reservation, ReservationStage } from "@/lib/inventory-types";

const ORDER: ReservationStage[] = [
  "reserved",
  "documents",
  "down_payment",
  "paying",
  "paid",
  "closed",
];
function nextStage(s: ReservationStage): ReservationStage | null {
  const i = ORDER.indexOf(s);
  return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null;
}
function stageLabel(v: string) {
  return RESERVATION_STAGE.find((s) => s.value === v)?.label ?? v;
}
const commLabel: Record<string, string> = {
  pending: "قيد الإجراء",
  earned: "مستحقة",
  paid: "مدفوعة",
};

export function DealsPipeline({
  initial,
  paidMap,
  canProcess,
  canClose,
  canApproveCommission,
}: {
  initial: Reservation[];
  paidMap: Record<string, number>;
  canProcess: boolean;
  canClose: boolean;
  canApproveCommission: boolean;
}) {
  const [rows, setRows] = useState(initial);
  const [paid, setPaid] = useState(paidMap);
  const [filter, setFilter] = useState<"all" | ReservationStage>("all");
  const [busy, setBusy] = useState("");
  const [payFor, setPayFor] = useState<Reservation | null>(null);

  async function advance(r: Reservation, to: ReservationStage) {
    setBusy(r.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("advance_reservation", {
      p_res_id: r.id,
      p_new_stage: to,
    });
    setBusy("");
    if (!error) {
      setRows((rs) =>
        rs.map((x) =>
          x.id === r.id
            ? {
                ...x,
                stage: to,
                commission_status: to === "closed" ? "earned" : x.commission_status,
              }
            : x,
        ),
      );
    } else {
      alert("تعذّر: " + error.message);
    }
  }

  async function approveCommission(r: Reservation) {
    setBusy(r.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("mark_commission_paid", { p_res_id: r.id });
    setBusy("");
    if (!error)
      setRows((rs) =>
        rs.map((x) => (x.id === r.id ? { ...x, commission_status: "paid" } : x)),
      );
  }

  const shown = filter === "all" ? rows : rows.filter((r) => r.stage === filter);
  const stageCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) m[r.stage] = (m[r.stage] ?? 0) + 1;
    return m;
  }, [rows]);

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          الكل ({rows.length})
        </Chip>
        {ORDER.map((s) => (
          <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {stageLabel(s)} ({stageCount[s] ?? 0})
          </Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد معاملات في هذه المرحلة.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((r) => {
            const nxt = nextStage(r.stage);
            const paidTotal = paid[r.id] ?? 0;
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-bold">
                      {r.project?.name} — وحدة {r.unit?.unit_no}
                    </div>
                    <div className="text-sm" style={{ color: "var(--muted)" }}>
                      العميل: {r.client_name || "—"} · المسوّق:{" "}
                      {r.marketer?.full_name || r.marketer?.email || "—"}
                    </div>
                  </div>
                  <span className="badge" style={{ background: "var(--brand)", color: "#fff" }}>
                    {stageLabel(r.stage)}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap mt-3 text-sm">
                  {r.agreed_price != null && (
                    <Tag>السعر {Number(r.agreed_price).toLocaleString("en-US")}</Tag>
                  )}
                  <Tag>مدفوع {paidTotal.toLocaleString("en-US")}</Tag>
                  {r.commission_amount != null && (
                    <span className="badge" style={{ background: "#fef9c3", color: "#854d0e" }}>
                      عمولة المسوّق {Number(r.commission_amount).toLocaleString("en-US")} ·{" "}
                      {commLabel[r.commission_status]}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap mt-3">
                  {canProcess && (
                    <button
                      onClick={() => setPayFor(r)}
                      className="btn btn-ghost !py-1.5 !px-3 text-sm"
                    >
                      ＋ دفعة
                    </button>
                  )}
                  {nxt && nxt !== "closed" && canProcess && (
                    <button
                      onClick={() => advance(r, nxt)}
                      className="btn btn-primary !py-1.5 !px-3 text-sm"
                      disabled={busy === r.id}
                    >
                      → {stageLabel(nxt)}
                    </button>
                  )}
                  {r.stage !== "closed" && canClose && (
                    <button
                      onClick={() => advance(r, "closed")}
                      className="btn !py-1.5 !px-3 text-sm"
                      style={{ background: "#16a34a", color: "#fff" }}
                      disabled={busy === r.id}
                    >
                      ✓ إقفال (بيع)
                    </button>
                  )}
                  {r.commission_status === "earned" && canApproveCommission && (
                    <button
                      onClick={() => approveCommission(r)}
                      className="btn btn-ghost !py-1.5 !px-3 text-sm"
                      style={{ color: "var(--brand)" }}
                      disabled={busy === r.id}
                    >
                      اعتماد صرف العمولة
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {payFor && canProcess && (
        <PaymentModal
          reservation={payFor}
          onClose={() => setPayFor(null)}
          onAdded={(amount) => {
            setPaid((m) => ({ ...m, [payFor.id]: (m[payFor.id] ?? 0) + amount }));
            setPayFor(null);
          }}
        />
      )}
    </div>
  );
}

function PaymentModal({
  reservation,
  onClose,
  onAdded,
}: {
  reservation: Reservation;
  onClose: () => void;
  onAdded: (amount: number) => void;
}) {
  const [type, setType] = useState("down");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("deal_payments").insert({
      reservation_id: reservation.id,
      type,
      amount: Number(amount),
      method: method.trim() || null,
      paid_at: new Date().toISOString(),
    });
    setSaving(false);
    if (!error) onAdded(Number(amount));
    else alert("تعذّر: " + error.message);
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.5)" }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="card w-full max-w-[400px] p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold m-0">تسجيل دفعة</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost !py-1 !px-3">
            ✕
          </button>
        </div>
        <div>
          <label className="label">النوع</label>
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="down">دفعة مقدّمة</option>
            <option value="installment">قسط</option>
            <option value="other">أخرى</option>
          </select>
        </div>
        <div>
          <label className="label">المبلغ (ر.س) *</label>
          <input
            className="field"
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="label">طريقة الدفع</label>
          <input
            className="field"
            placeholder="تحويل / شبكة / هلا"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />
        </div>
        <button className="btn btn-primary w-full" disabled={saving}>
          {saving ? "..." : "حفظ الدفعة"}
        </button>
      </form>
    </div>
  );
}

function Chip({
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
      className="px-3 py-1.5 rounded-lg text-sm font-bold"
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

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
      {children}
    </span>
  );
}
