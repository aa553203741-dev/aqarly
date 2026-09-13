import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/me";
import { getPublicSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "project-media";

// وسيط الوسائط: يوقّع رابطًا موقّتًا لملف في المخزن الخاص ثم يعيد التوجيه إليه.
// محصور بالمستخدمين المعتمدين — الزائر يرى وسائط بطاقة المشاركة عبر توقيع
// خادمي مباشر في /u/[id]، لا عبر هذا المسار.
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("p");
  if (!path) return new NextResponse("bad request", { status: 400 });

  const me = await getMe();
  if (!me || !me.isActive) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const { mediaLinkSeconds } = await getPublicSettings();
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, mediaLinkSeconds);

  if (error || !data?.signedUrl) {
    return new NextResponse("not found", { status: 404 });
  }

  const res = NextResponse.redirect(data.signedUrl, 302);
  // خزّن التوجيه في متصفح المستخدم دون مدة الصلاحية بهامش أمان،
  // فلا نوقّع عند كل تحميل صورة.
  res.headers.set(
    "Cache-Control",
    `private, max-age=${Math.max(30, mediaLinkSeconds - 120)}`,
  );
  return res;
}
