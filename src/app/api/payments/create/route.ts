import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvoice } from "@/lib/moyasar";

export async function POST(request: Request) {
  // 1) المستخدم الحالي من الجلسة
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const billing: "monthly" | "yearly" =
    body?.billing === "yearly" ? "yearly" : "monthly";

  // 2) السعر من إعدادات التطبيق (لا نثق بأي مبلغ من العميل)
  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["premium_monthly_price", "premium_yearly_price"]);
  const map = new Map(
    (settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]),
  );
  const priceSar =
    billing === "yearly"
      ? Number(map.get("premium_yearly_price") ?? 290)
      : Number(map.get("premium_monthly_price") ?? 29);
  const amount = Math.round(priceSar * 100); // هللات

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  // 3) إنشاء الفاتورة لدى Moyasar
  let invoice;
  try {
    invoice = await createInvoice({
      amount,
      description: `اشتراك عقارلي المميّز (${billing === "yearly" ? "سنوي" : "شهري"})`,
      callbackUrl: `${siteUrl}/dashboard/upgrade`,
      metadata: { user_id: user.id, billing },
    });
  } catch (e) {
    console.error("moyasar create invoice error", e);
    return NextResponse.json(
      { error: "تعذّر إنشاء عملية الدفع" },
      { status: 502 },
    );
  }

  // 4) سجّل الدفعة (عبر service_role — يتجاوز RLS)
  try {
    const admin = createAdminClient();
    await admin.from("payments").insert({
      id: invoice.id,
      user_id: user.id,
      amount,
      currency: "SAR",
      billing,
      status: "initiated",
      provider: "moyasar",
    });
  } catch (e) {
    // غير حرِج — الـwebhook هو مصدر الحقيقة للتفعيل
    console.error("record payment error", e);
  }

  return NextResponse.json({ url: invoice.url, id: invoice.id });
}
