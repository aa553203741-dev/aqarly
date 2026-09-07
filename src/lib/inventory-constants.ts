// ثوابت المخزون

export const PROJECT_STATUS = [
  { value: "ready", label: "جاهز", color: "#16a34a" },
  { value: "under_construction", label: "تحت الإنشاء", color: "#d97706" },
  { value: "off_plan", label: "بيع على الخارطة", color: "#2563eb" },
] as const;

export const UNIT_STATUS = [
  { value: "available", label: "متاحة", color: "#16a34a" },
  { value: "reserved", label: "محجوزة", color: "#d97706" },
  { value: "sold", label: "مباعة", color: "#dc2626" },
  { value: "unavailable", label: "غير متاحة", color: "#6b7280" },
] as const;

export const INTEREST_STATUS = [
  { value: "shown", label: "عُرضت", color: "#6b7280" },
  { value: "interested", label: "مهتم", color: "#2563eb" },
  { value: "visited", label: "زار", color: "#d97706" },
  { value: "negotiating", label: "تفاوض", color: "#0d7a6e" },
  { value: "rejected", label: "غير مناسب", color: "#dc2626" },
] as const;

export const RESERVATION_STAGE = [
  { value: "reserved", label: "محجوزة" },
  { value: "documents", label: "مستندات" },
  { value: "down_payment", label: "دفعة مقدّمة" },
  { value: "paying", label: "سداد جارٍ" },
  { value: "paid", label: "مدفوعة" },
  { value: "closed", label: "مكتملة (إفراغ)" },
  { value: "cancelled", label: "ملغاة" },
] as const;
