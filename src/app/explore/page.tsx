import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signPublicMedia } from "@/lib/media-server";
import { Logo } from "@/components/Logo";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ExploreFilters, type DistrictOpt } from "@/components/ExploreFilters";
import { PROJECT_STATUS } from "@/lib/inventory-constants";
import { APP_NAME } from "@/lib/constants";

type Row = {
  id: string;
  price: number | null;
  discount_price: number | null;
  bedrooms: number | null;
  area: number | null;
  bathrooms: number | null;
  project_name: string;
  project_status: string;
  cover_image: string | null;
  developer_id: string | null;
  developer_name: string | null;
  city: string | null;
  district_name: string | null;
};

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}
function num(v: string): number | null {
  const n = Number(v);
  return v && Number.isFinite(n) ? n : null;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const city = str(sp.city);
  const district = str(sp.district);
  const beds = str(sp.beds);
  const min = str(sp.min);
  const max = str(sp.max);
  const brokerCode = str(sp.b) || undefined;
  const q = brokerCode ? `?b=${brokerCode}` : "";

  const supabase = await createClient();
  const [{ data: units }, { data: districts }] = await Promise.all([
    supabase.rpc("public_explore", {
      p_city: city || null,
      p_district: district || null,
      p_bedrooms: num(beds),
      p_price_min: num(min),
      p_price_max: num(max),
      p_broker_code: brokerCode ?? null,
      p_limit: 120,
    }),
    supabase.rpc("public_districts", { p_broker_code: brokerCode ?? null }),
  ]);

  const rows = (units as Row[]) ?? [];
  const { sign } = await signPublicMedia(rows.map((r) => r.cover_image));

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[960px]">
        <div className="flex items-center justify-between mb-5">
          <Logo size={34} />
          <div className="flex gap-2">
            <Link href="/calculator" className="btn btn-ghost text-sm">
              🧮 الحاسبة
            </Link>
            <Link href="/favorites" className="btn btn-ghost text-sm">
              ♥ المفضّلة
            </Link>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold mt-0 mb-1">استكشف العروض</h1>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          {rows.length} وحدة متاحة
        </p>

        <ExploreFilters
          districts={(districts as DistrictOpt[]) ?? []}
          brokerCode={brokerCode}
          initial={{ city, district, beds, min, max }}
        />

        {rows.length === 0 ? (
          <div className="card p-10 text-center" style={{ color: "var(--muted)" }}>
            لا توجد وحدات مطابقة. جرّب توسيع الفلاتر.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((r) => {
              const price = r.discount_price ?? r.price;
              const s =
                PROJECT_STATUS.find((x) => x.value === r.project_status) ??
                PROJECT_STATUS[2];
              return (
                <div key={r.id} className="card overflow-hidden relative">
                  {r.cover_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sign(r.cover_image)}
                      alt=""
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="absolute top-2 left-2">
                    <FavoriteButton unitId={r.id} />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-base">{r.project_name}</div>
                      <span
                        className="badge shrink-0"
                        style={{ background: s.color, color: "#fff" }}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="text-sm mt-1 mb-0" style={{ color: "var(--muted)" }}>
                      {[r.city, r.district_name].filter(Boolean).join(" — ")}
                    </p>
                    {price != null && (
                      <div
                        className="text-lg font-extrabold mt-2"
                        style={{ color: "var(--brand)" }}
                      >
                        {Number(price).toLocaleString("en-US")} ر.س
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap mt-2 text-sm">
                      {r.bedrooms != null && <Tag>{r.bedrooms} غرف</Tag>}
                      {r.area != null && <Tag>{r.area} م²</Tag>}
                      {r.bathrooms != null && <Tag>{r.bathrooms} دورات</Tag>}
                    </div>
                    <Link
                      href={`/u/${r.id}${q}`}
                      className="btn btn-primary w-full mt-3 !py-1.5 text-sm"
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs mt-8" style={{ color: "var(--muted)" }}>
          عرض مقدّم عبر{" "}
          <Link href="/" style={{ color: "var(--brand)", fontWeight: 700 }}>
            {APP_NAME}
          </Link>
        </p>
      </div>
    </main>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="badge"
      style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
    >
      {children}
    </span>
  );
}
