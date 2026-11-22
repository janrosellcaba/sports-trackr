"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SELECT_CLS } from "@/lib/ui";

const ARROW =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-chip text-muted transition-colors duration-150 hover:bg-chip-hover hover:text-ink";

/** Prev / month picker / next. `months` arrives newest first. */
export function MonthNavigator({
  month,
  months,
}: {
  month: string;
  months: { key: string; label: string }[];
}) {
  const router = useRouter();
  const index = months.findIndex((item) => item.key === month);
  const older = index >= 0 ? months[index + 1] : undefined;
  const newer = index > 0 ? months[index - 1] : undefined;

  return (
    <div className="flex items-center gap-2">
      {older ? (
        <Link href={`/analytics?month=${older.key}`} aria-label="Previous month" className={ARROW}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${ARROW} opacity-30`}>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}
      {/* A native select so phones get the system wheel picker. */}
      <select
        value={month}
        aria-label="Month"
        onChange={(event) => router.push(`/analytics?month=${event.target.value}`)}
        className={`${SELECT_CLS} min-w-0 flex-1 text-center font-semibold`}
      >
        {months.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>
      {newer ? (
        <Link href={`/analytics?month=${newer.key}`} aria-label="Next month" className={ARROW}>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${ARROW} opacity-30`}>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
