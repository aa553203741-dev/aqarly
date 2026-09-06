"use client";

import { useEffect } from "react";

// يسجّل Service Worker لتفعيل تثبيت التطبيق على الجوال (PWA).
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* تجاهل الفشل بهدوء (متصفح قديم مثلًا) */
      });
    }
  }, []);
  return null;
}
