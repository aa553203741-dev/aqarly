import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSaudiPhone, sendLeadWhatsApp } from "@/lib/whatsapp";
import { DEAL_TYPES, PROPERTY_TYPES, labelOf } from "@/lib/constants";

/**
 * يُستدعى من Supabase Database Webhook عند إدراج صف في client_leads.
 * يبحث عن جوال الوسيط (عبر service_role) ويرسل له إشعار واتساب.
 * التحقق: رأس x-notify-secret يجب أن يطابق NOTIFY_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.NOTIFY_WEBHOOK_SECRET;
  if (secret && request.headers.get("x-notify-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  // يدعم صيغة Supabase Webhook ({record}) والصف الخام (to_jsonb)
  const row = payload.record ?? payload;
  const brokerId: string | undefined = row?.broker_user_id;
  if (!brokerId) {
    return NextResponse.json({ ok: false, reason: "no_broker" });
  }

  // نُفضّل جوال الوسيط المُرسَل مباشرة من تريغر Supabase (لا يحتاج service_role).
  // وإن لم يُرسَل، نرجع لاستعلام بمفتاح الأدمن كخيار احتياطي.
  let rawPhone: string | null = row.broker_phone ?? null;
  let brokerName: string | null = row.broker_name ?? null;
  let dbErr: string | null = null;

  if (!rawPhone) {
    try {
      const admin = createAdminClient();
      const { data: profile, error } = await admin
        .from("profiles")
        .select("phone, full_name")
        .eq("id", brokerId)
        .maybeSingle();
      rawPhone = profile?.phone ?? null;
      brokerName = brokerName ?? profile?.full_name ?? null;
      dbErr = error?.message ?? null;
    } catch (e) {
      dbErr = e instanceof Error ? e.message : String(e);
    }
  }

  const phone = normalizeSaudiPhone(rawPhone ?? "");
  if (!phone) {
    return NextResponse.json({
      ok: false,
      reason: "no_phone",
      debug: { dbError: dbErr, rawPhone },
    });
  }

  const propType =
    row.property_type === "other"
      ? row.property_type_other || "غير ذلك"
      : labelOf(PROPERTY_TYPES, row.property_type);
  const budget = row.budget
    ? ` · ميزانية ${Number(row.budget).toLocaleString("en-US")} ر.س`
    : "";
  const summary =
    `طلب جديد من ${row.client_name} (${row.phone}) — ` +
    `${labelOf(DEAL_TYPES, row.deal_type)} ${propType} في ${row.city}` +
    `${row.district ? " - " + row.district : ""}${budget}`;

  try {
    const result = await sendLeadWhatsApp(phone, summary);
    return NextResponse.json({ ok: result.sent, reason: result.reason });
  } catch (e) {
    console.error("whatsapp notify error", e);
    return NextResponse.json({ ok: false, reason: "send_failed" });
  }
}
