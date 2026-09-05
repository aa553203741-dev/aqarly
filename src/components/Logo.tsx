import { APP_NAME } from "@/lib/constants";

export function Logo({
  size = 40,
  withName = true,
}: {
  size?: number;
  withName?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
      >
        <rect width="48" height="48" rx="13" fill="var(--brand)" />
        <path
          d="M24 11L36 20.5V37H28.5V28.5H19.5V37H12V20.5L24 11Z"
          fill="white"
        />
        <circle cx="24" cy="21" r="2.6" fill="var(--gold)" />
      </svg>
      {withName && (
        <span
          className="font-extrabold text-[20px]"
          style={{ color: "var(--text)" }}
        >
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
