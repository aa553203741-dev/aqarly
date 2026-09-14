import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/me";
import { getPublicSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "project-media";

// وسيط الوسائط: يوقّع رابطًا موقّتًا لملف في المخزن الخاص ثم يعيد التوجيه إليه.
// محصور بالمستخدمين المعتمدين — الزائر يرى وسائط بطاقة المشاركة عبر توقيع
// خادمي مباشر في /u/[id]، لا عبر هذا المسار.
//
// التوقيع يتم بجلسة المستخدم نفسه (بلا service_role) اعتمادًا على سياسة
// القراءة للمسجّلين. يُلجأ إلى service_role احتياطًا فقط إن تعذّر ذلك
// (مثلاً قبل تطبيق سياسة المرحلة 25).
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("p");
  if (!path) return new NextResponse("bad request", { status: 400 });

  const me = await getMe();
  if (!me || !me.isActive) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const { mediaLinkSeconds } = await getPublicSettings();

  // المسار الأساسي: توقيع بجلسة المستخدم.
  const supabase = await createClient();
  let signedUrl: string | undefined;
  const primary = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, mediaLinkSeconds);
  signedUrl = primary.data?.signedUrl;

  // احتياط: service_role (يغطّي ما قبل تطبيق سياسة القراءة).
  if (!signedUrl) {
    try {
      const admin = createAdminClient();
      const fallback = await admin.storage
        .from(BUCKET)
        .createSignedUrl(path, mediaLinkSeconds);
      signedUrl = fallback.data?.signedUrl;
    } catch {
      /* المفتاح غير متاح — نكتفي بالمسار الأساسي */
    }
  }

  if (!signedUrl) return new NextResponse("not found", { status: 404 });

  const res = NextResponse.redirect(signedUrl, 302);
  // خزّن التوجيه في متصفح المستخدم دون مدة الصلاحية بهامش أمان،
  // فلا نوقّع عند كل تحميل صورة.
  res.headers.set(
    "Cache-Control",
    `private, max-age=${Math.max(30, mediaLinkSeconds - 120)}`,
  );
  return res;
}
