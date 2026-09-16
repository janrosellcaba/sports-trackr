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
      <path d="M6 8H42L37.5 17.5H10.5L6 8Z" className="fill-brand" />
      <path d="M20 17.5H28.5L26.2 41H18.8L20 17.5Z" className="fill-brand-dark" />
      <path
        d="M31 24L36 19L41 24"
        className="stroke-brand"
        strokeWidth="2.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M32.5 30.5L36 27L39.5 30.5"
        className="stroke-brand-dark"
        strokeWidth="2.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M33.5 36.5L36 34L38.5 36.5"
        className="stroke-brand"
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
        <span className="flex items-baseline font-display leading-none">
          <span className="text-lg font-extrabold tracking-[0.28em] text-ink">
            TRACK
          </span>
          <span className="text-lg font-extrabold tracking-[0.08em] text-brand-text">
            R
          </span>
        </span>
      )}
    </span>
  );
}
