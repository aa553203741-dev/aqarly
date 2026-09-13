import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { Logo } from "@/components/Logo";
import { SignOutLink } from "@/components/SignOutLink";

// شاشة الحساب غير المعتمد. لا تعرض أي بيانات من المنشأة —
// الحساب هنا لا يرى شيئًا أصلًا (current_org() تُرجع NULL قبل الاعتماد).
export default async function PendingPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.isActive) redirect("/dashboard");

  const rejected = me.status === "rejected";
  const p = me.profile;

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[460px]">
        <div className="flex justify-center mb-6">
          <Logo size={52} />
        </div>
        <div className="card p-7 text-center">
          <div className="text-4xl mb-3">{rejected ? "🚫" : "⏳"}</div>
          <h1 className="text-lg font-bold m-0">
            {rejected ? "لم يُعتمد هذا الحساب" : "حسابك قيد المراجعة"}
          </h1>
          <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>
            {rejected
              ? p?.rejected_reason ||
                "تواصل مع مشرف المنشأة إن كنت تعتقد أن هذا خطأ."
              : "لا يُفعَّل الحساب إلا بموافقة مشرف المنشأة. ستصلك رسالة على بريدك فور اعتماده."}
          </p>

          {!rejected && (
            <div
              className="mt-5 pt-5 text-sm text-right"
              style={{ borderTop: "1px solid var(--line)", color: "var(--muted)" }}
            >
              <p className="m-0 mb-2 font-bold" style={{ color: "var(--fg)" }}>
                لديك كود دعوة من المشرف؟
              </p>
              <p className="m-0">
                أعد التسجيل بالكود، أو أرسله للمشرف ليعتمد حسابك مباشرة.
              </p>
            </div>
          )}

          <div
            className="mt-5 pt-5 text-xs"
            style={{ borderTop: "1px solid var(--line)", color: "var(--muted)" }}
          >
            <span style={{ direction: "ltr", display: "inline-block" }}>
              {p?.email}
            </span>
          </div>

          <SignOutLink className="btn btn-ghost w-full mt-4 text-sm" />
        </div>
      </div>
    </main>
  );
}
