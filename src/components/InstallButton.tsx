"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function InstallButton({
  className = "btn btn-primary w-full !py-1.5 text-sm",
}: {
  className?: string;
}) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    try {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setInstalled(true);
        return;
      }
    } catch {
      /* تجاهل */
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const ua = navigator.userAgent || "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    const standalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (ios && !standalone) setIsIos(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handle() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else if (isIos) {
      setShowIosHelp(true);
    }
  }

  // لا يُعرض إن كان مثبّتًا، أو لا توجد وسيلة تثبيت (متصفح غير مدعوم)
  if (installed || (!deferred && !isIos)) return null;

  return (
    <>
      <button onClick={handle} className={className}>
        ⬇ تنزيل التطبيق
      </button>

      {showIosHelp && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.5)" }}
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="card w-full max-w-[400px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold m-0">تثبيت على آيفون</h2>
              <button onClick={() => setShowIosHelp(false)} className="btn btn-ghost !py-1 !px-3">
                ✕
              </button>
            </div>
            <ol className="text-sm flex flex-col gap-2 pr-4" style={{ color: "var(--muted)" }}>
              <li>
                اضغط زر المشاركة <b>􀈂 (Share)</b> في شريط Safari السفلي.
              </li>
              <li>
                اختر <b>«إضافة إلى الشاشة الرئيسية»</b> (Add to Home Screen).
              </li>
              <li>اضغط <b>«إضافة»</b> — يظهر «عقارلي» كتطبيق.</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
