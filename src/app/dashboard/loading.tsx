export default function Loading() {
  const bar = "rounded-xl";
  const bg = { background: "var(--border)", opacity: 0.5 } as const;
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className={bar} style={{ ...bg, height: 30, width: 160 }} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={bar} style={{ ...bg, height: 84 }} />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={bar} style={{ ...bg, height: 72 }} />
      ))}
    </div>
  );
}
