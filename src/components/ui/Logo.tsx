type LogoProps = {
  compact?: boolean;
  className?: string;
};

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 8H42L37.5 17.5H10.5L6 8Z" fill="#84cc16" />
      <path d="M20 17.5H28.5L26.2 41H18.8L20 17.5Z" fill="#10b981" />
      <path
        d="M31 24L36 19L41 24"
        stroke="#84cc16"
        strokeWidth="2.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M32.5 30.5L36 27L39.5 30.5"
        stroke="#10b981"
        strokeWidth="2.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M33.5 36.5L36 34L38.5 36.5"
        stroke="#84cc16"
        strokeWidth="1.8"
        strokeLinecap="square"
        opacity="0.85"
      />
    </svg>
  );
}

export function Logo({ compact = false, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={compact ? "h-7 w-7" : "h-8 w-8"} />
      {compact ? (
        <span className="sr-only">Trackr</span>
      ) : (
        <span className="flex items-baseline leading-none">
          <span className="text-lg font-semibold tracking-[0.34em] text-neutral-50">
            TRACK
          </span>
          <span className="font-mono text-lg font-semibold tracking-[0.12em] text-lime-400">
            R
          </span>
        </span>
      )}
    </span>
  );
}
