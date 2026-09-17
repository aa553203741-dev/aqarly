export default function Loading() {
  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[960px]">
        <div
          className="h-8 w-40 rounded-lg mb-4"
          style={{ background: "color-mix(in srgb, var(--text) 8%, transparent)" }}
        />
        <div
          className="h-28 rounded-2xl mb-5"
          style={{ background: "color-mix(in srgb, var(--text) 6%, transparent)" }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ background: "color-mix(in srgb, var(--text) 6%, transparent)", height: 240 }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
