import { APP_NAME } from "@/lib/constants";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-2xl bg-clinic-500 text-white shadow-soft"
        aria-hidden
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3c3.5 3.2 6 6 6 9.5A6 6 0 0 1 6 12.5C6 9 8.5 6.2 12 3Z"
            fill="currentColor"
            opacity=".95"
          />
          <circle cx="12" cy="13" r="2" fill="#fff" opacity=".85" />
        </svg>
      </span>
      {!compact && (
        <span className="text-lg font-semibold tracking-tight text-ink-800">
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
