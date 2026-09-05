// ثوابت المجال — عقارلي

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "عقارلي";
export const APP_TAGLINE = "أداة الوسيط العقاري الذكية";

export const DEAL_TYPES = [
  { value: "buy", label: "طلب شراء" },
  { value: "rent", label: "طلب إيجار" },
] as const;

export const PROPERTY_TYPES = [
  { value: "apartment", label: "شقة" },
  { value: "villa", label: "فيلا" },
  { value: "residential_building", label: "عمارة سكنية" },
  { value: "commercial_building", label: "عمارة تجارية" },
  { value: "residential_land", label: "أرض سكنية" },
  { value: "commercial_land", label: "أرض تجارية" },
  { value: "other", label: "غير ذلك" },
] as const;

export const LEAD_STATUSES = [
  { value: "new", label: "جديد", color: "#2563eb" },
  { value: "in_progress", label: "قيد المتابعة", color: "#d97706" },
  { value: "done", label: "مكتمل", color: "#16a34a" },
  { value: "rejected", label: "غير مناسب", color: "#dc2626" },
] as const;

export const LISTING_STATUSES = [
  { value: "active", label: "متاح", color: "#16a34a" },
  { value: "closed", label: "مغلق", color: "#6b7280" },
] as const;

// المدن السعودية (مختصرة على الرئيسية؛ القائمة الكاملة أدناه)
export const CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر",
  "الظهران", "الأحساء", "الطائف", "تبوك", "بريدة", "عنيزة", "حائل",
  "أبها", "خميس مشيط", "نجران", "جازان", "الباحة", "عرعر", "سكاكا",
  "القطيف", "الجبيل", "ينبع", "الخرج", "حفر الباطن", "القريات",
] as const;

export function labelOf<T extends readonly { value: string; label: string }[]>(
  list: T,
  value: string,
): string {
  return list.find((x) => x.value === value)?.label ?? value;
}
