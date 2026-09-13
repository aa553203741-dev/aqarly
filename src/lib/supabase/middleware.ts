import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "./config";

const SESSION_COOKIE = "aq_sess";

// مدة الجلسة (دقائق) من app_settings، مع تخزين مؤقت 60ث لتقليل الاستعلامات.
let sessionCache: { minutes: number; at: number } | null = null;
async function sessionMinutes(
  supabase: ReturnType<typeof createServerClient>,
): Promise<number> {
  const now = Date.now();
  if (sessionCache && now - sessionCache.at < 60_000) return sessionCache.minutes;
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "session_minutes")
    .maybeSingle();
  const n = Number((data as { value: string } | null)?.value);
  const minutes = Number.isFinite(n) && n > 0 ? Math.floor(n) : 480;
  sessionCache = { minutes, at: now };
  return minutes;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/dashboard") || path.startsWith("/admin");

  // لا مستخدم: نظّف ختم الجلسة ثم طبّق حماية المسارات.
  if (!user) {
    response.cookies.delete(SESSION_COOKIE);
    if (isProtected) {
      const to = request.nextUrl.clone();
      to.pathname = "/login";
      to.searchParams.set("next", path);
      return NextResponse.redirect(to);
    }
    return response;
  }

  // مستخدم مسجّل: افرض مدة الجلسة المطلقة.
  const startRaw = request.cookies.get(SESSION_COOKIE)?.value;
  const start = Number(startRaw);
  const now = Date.now();

  if (!startRaw || !Number.isFinite(start)) {
    // أول طلب بعد الدخول: ابدأ نافذة الجلسة الآن.
    response.cookies.set(SESSION_COOKIE, String(now), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  } else {
    const maxMs = (await sessionMinutes(supabase)) * 60_000;
    if (now - start > maxMs) {
      // انتهت الجلسة: أزل ارتباطات الدخول واطلب تسجيلًا جديدًا.
      const to = request.nextUrl.clone();
      to.pathname = "/login";
      to.searchParams.set("expired", "1");
      if (isProtected) to.searchParams.set("next", path);
      const redirect = NextResponse.redirect(to);
      for (const c of request.cookies.getAll()) {
        if (c.name.startsWith("sb-")) redirect.cookies.delete(c.name);
      }
      redirect.cookies.delete(SESSION_COOKIE);
      return redirect;
    }
  }

  return response;
}
