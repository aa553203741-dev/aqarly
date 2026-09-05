// تكامل Moyasar (ميسّر) — واجهة REST. يُستخدم على الخادم فقط.
// التوثيق: https://docs.moyasar.com

const BASE = "https://api.moyasar.com/v1";

function authHeader(): string {
  const key = process.env.MOYASAR_SECRET_KEY;
  if (!key) throw new Error("MOYASAR_SECRET_KEY غير مضبوط في البيئة");
  // مصادقة Basic: المفتاح السرّي كاسم مستخدم وكلمة مرور فارغة
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

export interface MoyasarInvoice {
  id: string;
  status: string;
  amount: number;
  currency: string;
  url: string;
  metadata?: Record<string, string> | null;
}

export interface MoyasarPayment {
  id: string;
  status: string; // initiated | paid | failed | ...
  amount: number;
  currency: string;
  invoice_id?: string | null;
  metadata?: Record<string, string> | null;
}

/** إنشاء فاتورة مُستضافة — تُرجع رابط صفحة الدفع (url). */
export async function createInvoice(params: {
  amount: number; // بالهللات
  description: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<MoyasarInvoice> {
  const res = await fetch(`${BASE}/invoices`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: "SAR",
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Moyasar invoice failed (${res.status}): ${text}`);
  }
  return (await res.json()) as MoyasarInvoice;
}

/** جلب دفعة للتأكّد من حالتها (مضاد للتزوير في الـwebhook). */
export async function getPayment(id: string): Promise<MoyasarPayment> {
  const res = await fetch(`${BASE}/payments/${id}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Moyasar getPayment failed (${res.status}): ${text}`);
  }
  return (await res.json()) as MoyasarPayment;
}
