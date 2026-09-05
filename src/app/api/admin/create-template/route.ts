import { NextResponse } from "next/server";

// نقطة مؤقتة لإنشاء قالب واتساب برمجيًا (بدل واجهة Meta المربكة).
// محميّة برمز الإشعار. تُحذف بعد إنشاء القالب.
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== process.env.NOTIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const waba = "998327409926861"; // WhatsApp Business account ID
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "ar";
  const name = process.env.WHATSAPP_TEMPLATE || "new_lead";

  if (!token) {
    return NextResponse.json({ error: "WHATSAPP_TOKEN missing" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${waba}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          language: lang,
          category: "UTILITY",
          components: [
            {
              type: "BODY",
              text: "لديك طلب عميل جديد في عقارلي: {{1}}",
              example: { body_text: [["عميل جديد - الرياض"]] },
            },
          ],
        }),
      },
    );
    const body = await res.json();
    return NextResponse.json({ httpStatus: res.status, body });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
