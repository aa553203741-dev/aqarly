import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signPublicMedia } from "@/lib/media-server";
import { Logo } from "@/components/Logo";
import { PROJECT_STATUS } from "@/lib/inventory-constants";
import { APP_NAME } from "@/lib/constants";

type Row = {
  developer_id: string;
  developer_name: string;
  logo_url: string | null;
  project_id: string;
  project_name: string;
  project_status: string;
  cover_image: string | null;
  city: string | null;
  district_name: string | null;
  total_units: number;
  available_units: number;
  start_price: number | null;
};

export default async function PublicDeveloperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_developer", { p_dev: id });
  const rows = (data as Row[]) ?? [];
  if (rows.length === 0) notFound();

  const dev = rows[0];
  const { sign } = await signPublicMedia([
    dev.logo_url,
    ...rows.map((r) => r.cover_image),
  ]);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[720px]">
        <div className="flex items-center justify-between mb-5">
          <Logo size={34} />
          <Link href="/" className="btn btn-ghost text-sm">
            الرئيسية
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-5">
          {dev.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sign(dev.logo_url)}
              alt=""
              className="w-14 h-14 rounded-xl object-cover"
              style={{ border: "1px solid var(--border)" }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: "var(--brand-soft)" }}
            >
              🏢
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold m-0">{dev.developer_name}</h1>
            <p className="text-sm m-0" style={{ color: "var(--muted)" }}>
              {rows.length} مشروع
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map((r) => {
            const s =
              PROJECT_STATUS.find((x) => x.value === r.project_status) ??
              PROJECT_STATUS[2];
            return (
              <div key={r.project_id} className="card overflow-hidden">
                {r.cover_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sign(r.cover_image)}
                    alt=""
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-base">{r.project_name}</div>
                    <span
                      className="badge"
                      style={{ background: s.color, color: "#fff" }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="text-sm mt-1 mb-0" style={{ color: "var(--muted)" }}>
                    {[r.city, r.district_name].filter(Boolean).join(" — ")}
                  </p>
                  <div className="flex gap-2 flex-wrap mt-2 text-sm">
                    {r.start_price != null && (
                      <span className="font-bold" style={{ color: "var(--brand)" }}>
                        يبدأ من {Number(r.start_price).toLocaleString("en-US")} ر.س
                      </span>
                    )}
                    <span
                      className="badge"
                      style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
                    >
                      {r.available_units} متاحة من {r.total_units}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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
