import Link from "next/link";
import { Logo } from "@/components/Logo";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { CodeEntry } from "@/components/CodeEntry";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <div className="w-full max-w-[560px]">
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <Logo size={64} withName={false} />
          <h1 className="text-3xl font-extrabold m-0">{APP_NAME}</h1>
          <p className="text-[15px] m-0" style={{ color: "var(--muted)" }}>
            {APP_TAGLINE}
          </p>
        </div>

        <div className="card p-6 mb-5">
          <h2 className="text-lg font-bold mt-0 mb-1">عندك عقار تدوّر عليه؟</h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            أدخل كود الوسيط ليصلك للنموذج، ويوصل طلبك مباشرة له.
          </p>
          <CodeEntry />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/login" className="card p-5 text-center no-underline">
            <div className="text-2xl mb-1">🔑</div>
            <div className="font-bold" style={{ color: "var(--text)" }}>
              تسجيل الدخول
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              للوسطاء المسجّلين
            </div>
          </Link>
          <Link href="/signup" className="card p-5 text-center no-underline">
            <div className="text-2xl mb-1">✨</div>
            <div className="font-bold" style={{ color: "var(--text)" }}>
              حساب جديد
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              انضم كوسيط
            </div>
          </Link>
        </div>

        <p
          className="text-center text-xs mt-8"
          style={{ color: "var(--muted)" }}
        >
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>
    </main>
  );
}
