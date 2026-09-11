import { LABEL_CLS } from "@/lib/ui";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      {eyebrow ? <p className={LABEL_CLS}>{eyebrow}</p> : null}
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}
