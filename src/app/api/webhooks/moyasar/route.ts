import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPayment } from "@/lib/moyasar";

/**
 * webhook الدفع من Moyasar — مصدر الحقيقة لتفعيل الاشتراك.
 * الحماية طبقتان:
 *  1) مطابقة secret_token المُرسَل مع المضبوط في البيئة (إن وُجد).
 *  2) إعادة جلب الدفعة من Moyasar للتأكد أن حالتها paid فعلًا
 *     (لا نثق بجسم الطلب وحده — مضاد للتزوير).
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  // 1) تحقّق من الرمز السرّي للـwebhook (إن ضُبط)
  const expected = process.env.MOYASAR_WEBHOOK_SECRET;
  if (expected && payload.secret_token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = payload.data ?? payload;
  const paymentId: string | undefined = data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "no payment id" }, { status: 400 });
  }

  // 2) أعد جلب الدفعة من Moyasar وتأكّد أنها مدفوعة
  let payment;
  try {
    payment = await getPayment(paymentId);
  } catch (e) {
    console.error("verify payment error", e);
    // نعيد 200 حتى لا يعيد Moyasar المحاولة بلا نهاية على خطأ عابر لدينا
    return NextResponse.json({ ok: false, reason: "verify_failed" });
  }

  const admin = createAdminClient();

  if (payment.status !== "paid") {
    await admin
      .from("payments")
      .update({ status: payment.status === "failed" ? "failed" : "initiated" })
      .eq("id", paymentId);
    return NextResponse.json({ ok: true, status: payment.status });
  }

  const userId = payment.metadata?.user_id;
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "no_user" });
  }

  // 3) فعّل الاشتراك (سنوي = 365 يومًا، شهري = 30)
  const days = payment.metadata?.billing === "yearly" ? 365 : 30;

  await admin
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", paymentId);

  const { error } = await admin.rpc("activate_premium", {
    p_user_id: userId,
    p_days: days,
  });
  if (error) {
    console.error("activate_premium error", error);
    return NextResponse.json({ ok: false, reason: "activate_failed" });
  }

  return NextResponse.json({ ok: true });
}
