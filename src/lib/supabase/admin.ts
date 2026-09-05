import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

/**
 * عميل Supabase بصلاحية service_role — يتجاوز RLS.
 * يُستخدم حصريًا في كود الخادم (route handlers / server actions).
 * تحذير: لا تستورد هذا الملف في أي مكوّن عميل ("use client").
 */
export function createAdminClient() {
  const url = supabaseConfig().url; // رابط موثوق (يتجاوز قيمة بيئة تالفة)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY غير مضبوط في البيئة");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
