import Link from "next/link";
import { LABEL_CLS } from "@/lib/ui";

export function PageHeader({
  backHref,
  backLabel = "Settings",
  eyebrow,
  title,
  subtitle,
}: {
  backHref?: string;
  backLabel?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-1 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink"
        >
          ← {backLabel}
        </Link>
      ) : null}
      {eyebrow ? <p className={LABEL_CLS}>{eyebrow}</p> : null}
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}
