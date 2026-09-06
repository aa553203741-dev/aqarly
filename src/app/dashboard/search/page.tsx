export default function SearchPage() {
  return (
    <div className="max-w-[560px]">
      <h1 className="text-2xl font-extrabold mt-0 mb-4">البحث الذكي</h1>
      <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
        <div className="text-3xl mb-2">🔎</div>
        <div className="font-bold" style={{ color: "var(--text)" }}>
          البحث والفلترة السريعة
        </div>
        <p className="text-sm mt-1">
          البحث عبر كل المشاريع والمطوّرين مع الفلاتر والمقارنة — يأتي في المرحلة
          القادمة.
        </p>
      </div>
    </div>
  );
}
