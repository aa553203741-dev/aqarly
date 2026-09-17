"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { APP_NAME } from "@/lib/constants";

const KEY = "aqarly_favs";

type Card = {
  id: string;
  project_name: string;
  price: number | null;
  discount_price: number | null;
  bedrooms: number | null;
  area: number | null;
  city: string | null;
  district_name: string | null;
};

export default function FavoritesPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ids: string[] = [];
    try {
      ids = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      ids = [];
    }
    const supabase = createClient();
    Promise.all(
      ids.map((id) =>
        supabase
          .rpc("public_unit_card", { p_unit_id: id })
          .then(({ data }) => {
            const u = data?.[0];
            return u ? ({ id, ...u } as Card) : null;
          }),
      ),
    ).then((rows) => {
      setCards(rows.filter(Boolean) as Card[]);
      setLoading(false);
    });
  }, []);

  function remove(id: string) {
    setCards((c) => c.filter((x) => x.id !== id));
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
      localStorage.setItem(KEY, JSON.stringify(ids.filter((x) => x !== id)));
    } catch {
      /* تجاهل */
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[520px]">
        <div className="flex items-center justify-between mb-5">
          <Logo size={34} />
          <Link href="/explore" className="btn btn-ghost text-sm">
            استكشف العروض
          </Link>
        </div>
        <h1 className="text-2xl font-extrabold mt-0 mb-4">المفضّلة ♥</h1>

        {loading ? (
          <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
            جارِ التحميل…
          </div>
        ) : cards.length === 0 ? (
          <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
            لا عناصر في المفضّلة بعد. اضغط ♥ على أي عرض لحفظه هنا.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cards.map((c) => {
              const price = c.discount_price ?? c.price;
              return (
                <div key={c.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-base">{c.project_name}</div>
                    <button
                      onClick={() => remove(c.id)}
                      className="text-sm"
                      style={{ color: "var(--danger, #dc2626)" }}
                      aria-label="إزالة"
                    >
                      إزالة ✕
                    </button>
                  </div>
                  <p className="text-sm mt-1 mb-0" style={{ color: "var(--muted)" }}>
                    {[c.city, c.district_name].filter(Boolean).join(" — ")}
                  </p>
                  <div className="flex items-center justify-between gap-2 flex-wrap mt-2">
                    <div className="flex gap-2 flex-wrap text-sm">
                      {c.bedrooms != null && <Tag>{c.bedrooms} غرف</Tag>}
                      {c.area != null && <Tag>{c.area} م²</Tag>}
                      {price != null && (
                        <span className="font-bold" style={{ color: "var(--brand)" }}>
                          {Number(price).toLocaleString("en-US")} ر.س
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/u/${c.id}`}
                      className="btn btn-primary !py-1.5 !px-3 text-sm"
                    >
                      عرض
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted)" }}>
          {APP_NAME}
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
