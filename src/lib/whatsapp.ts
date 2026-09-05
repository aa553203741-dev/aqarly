// إشعارات واتساب عبر WhatsApp Cloud API (Meta). يُستخدم على الخادم فقط.
// التوثيق: https://developers.facebook.com/docs/whatsapp/cloud-api

/** تطبيع رقم سعودي إلى صيغة E.164 بدون + (مثال: 05xxxxxxxx → 9665xxxxxxxx). */
export function normalizeSaudiPhone(raw: string): string | null {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("966")) return d;
  if (d.startsWith("0")) return "966" + d.slice(1);
  if (d.startsWith("5") && d.length === 9) return "966" + d;
  if (d.length >= 10) return d; // احتياط: رقم دولي آخر
  return null;
}

/**
 * إرسال إشعار قالب واتساب برسالة نصية واحدة في متغيّر {{1}}.
 * الرسائل التي يبدؤها العمل (خارج نافذة 24 ساعة) تتطلب قالبًا معتمدًا من Meta.
 * إن لم تُضبط المفاتيح، تُتجاهل بهدوء (التطبيق يعمل بدونها).
 */
export async function sendLeadWhatsApp(
  to: string,
  bodyParam: string,
): Promise<{ sent: boolean; reason?: string }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const template = process.env.WHATSAPP_TEMPLATE || "new_lead";
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "ar";

  if (!token || !phoneId) {
    return { sent: false, reason: "not_configured" };
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: lang },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: bodyParam }],
            },
          ],
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${text}`);
  }
  return { sent: true };
}
