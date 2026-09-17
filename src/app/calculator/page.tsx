import Link from "next/link";
import { HomeCalculator } from "@/components/HomeCalculator";
import { Logo } from "@/components/Logo";
import { APP_NAME } from "@/lib/constants";

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const priceRaw = typeof sp.price === "string" ? Number(sp.price) : NaN;
  const price = Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : 500000;

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[480px]">
        <div className="flex items-center justify-between mb-5">
          <Logo size={34} />
          <Link href="/explore" className="btn btn-ghost text-sm">
            استكشف العروض
          </Link>
        </div>

        <h1 className="text-2xl font-extrabold mt-0 mb-1">حاسبة التمويل العقاري</h1>
        <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
          احسب قسطك الشهري التقديري قبل التواصل.
        </p>

        <HomeCalculator initialPrice={price} />

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted)" }}>
          عرض مقدّم عبر{" "}
          <Link href="/" style={{ color: "var(--brand)", fontWeight: 700 }}>
            {APP_NAME}
          </Link>
        </p>
      </div>
    </main>
  );
}
