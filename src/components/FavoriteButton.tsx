"use client";

import { useEffect, useState } from "react";

const KEY = "aqarly_favs";

function readFavs(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeFavs(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* التخزين محظور */
  }
}

// قلب مفضلة يعمل بلا تسجيل — يُخزَّن على جهاز الزائر فقط.
export function FavoriteButton({
  unitId,
  className = "",
}: {
  unitId: string;
  className?: string;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    // القراءة بعد التركيب لتفادي عدم تطابق SSR (لا localStorage على الخادم)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(readFavs().includes(unitId));
  }, [unitId]);

  function toggle() {
    const favs = readFavs();
    const next = favs.includes(unitId)
      ? favs.filter((x) => x !== unitId)
      : [unitId, ...favs];
    writeFavs(next);
    setOn(next.includes(unitId));
  }

  return (
    <button
      onClick={toggle}
      aria-label={on ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      aria-pressed={on}
      className={`w-9 h-9 rounded-full flex items-center justify-center ${className}`}
      style={{
        background: on ? "var(--brand)" : "color-mix(in srgb, var(--text) 8%, transparent)",
        color: on ? "#fff" : "var(--muted)",
      }}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill={on ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    </button>
  );
}
