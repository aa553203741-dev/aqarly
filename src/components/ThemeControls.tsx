"use client";

import { useEffect, useState } from "react";

const ACCENTS = [
  { key: "", label: "أخضر", color: "#0d7a6e" },
  { key: "blue", label: "أزرق", color: "#2563eb" },
  { key: "violet", label: "بنفسجي", color: "#7c3aed" },
  { key: "amber", label: "برتقالي", color: "#d97706" },
  { key: "rose", label: "وردي", color: "#e11d48" },
];

const MODES = [
  { key: "light", label: "فاتح" },
  { key: "dark", label: "داكن" },
  { key: "system", label: "تلقائي" },
];

function applyTheme(mode: string, accent: string) {
  const d = document.documentElement;
  const dark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) d.setAttribute("data-theme", "dark");
  else d.removeAttribute("data-theme");
  if (accent) d.setAttribute("data-accent", accent);
  else d.removeAttribute("data-accent");
}

export function ThemeControls() {
  const [mode, setMode] = useState("system");
  const [accent, setAccent] = useState("");

  useEffect(() => {
    try {
      setMode(localStorage.getItem("aqarly-theme") || "system");
      setAccent(localStorage.getItem("aqarly-accent") || "");
    } catch {
      /* تجاهل */
    }
  }, []);

  function chooseMode(m: string) {
    setMode(m);
    try {
      localStorage.setItem("aqarly-theme", m);
    } catch {
      /* تجاهل */
    }
    applyTheme(m, accent);
  }
  function chooseAccent(a: string) {
    setAccent(a);
    try {
      if (a) localStorage.setItem("aqarly-accent", a);
      else localStorage.removeItem("aqarly-accent");
    } catch {
      /* تجاهل */
    }
    applyTheme(mode, a);
  }

  return (
    <div className="card p-5">
      <h2 className="text-base font-bold mt-0 mb-3">المظهر</h2>

      <div className="mb-4">
        <div className="label">الوضع</div>
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => chooseMode(m.key)}
              className="px-4 py-2 rounded-lg text-sm font-bold"
              style={{
                background: mode === m.key ? "var(--brand)" : "var(--surface)",
                color: mode === m.key ? "#fff" : "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="label">اللون</div>
        <div className="flex gap-3 flex-wrap">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              onClick={() => chooseAccent(a.key)}
              aria-label={a.label}
              className="rounded-full flex items-center justify-center"
              style={{
                width: 34,
                height: 34,
                background: a.color,
                border: accent === a.key ? "3px solid var(--text)" : "3px solid transparent",
                boxShadow: "0 0 0 1px var(--border)",
              }}
            >
              {accent === a.key && (
                <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
