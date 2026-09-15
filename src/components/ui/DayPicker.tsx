"use client";

import { addDaysISO, formatDisplayDate, getTodayLocalDateISO } from "@/lib/calculations";
import { INPUT_CLS, chipClass } from "@/lib/ui";

export function DayPicker({
  today,
  date,
  onChange,
}: {
  today: string;
  date: string;
  onChange: (date: string) => void;
}) {
  const yesterday = addDaysISO(today, -1);
  const isToday = date === today;
  const isYesterday = date === yesterday;
  const isOther = !isToday && !isYesterday;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-chip/80 p-1">
        <button
          type="button"
          onClick={() => onChange(today)}
          className={`${chipClass(isToday)} flex items-center justify-center !rounded-lg py-2 text-xs`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onChange(yesterday)}
          className={`${chipClass(isYesterday)} flex items-center justify-center !rounded-lg py-2 text-xs`}
        >
          Yesterday
        </button>
        <label
          className={`relative flex cursor-pointer items-center justify-center ${chipClass(isOther)} !rounded-lg py-2 text-xs`}
        >
          Other
          <input
            type="date"
            max={today}
            value={isOther ? date : ""}
            onChange={(event) => {
              const next = event.target.value;
              if (next) onChange(next);
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Pick another date"
          />
        </label>
      </div>
      {isOther ? (
        <p className="text-center text-xs font-semibold text-muted">
          {formatDisplayDate(date)}
        </p>
      ) : null}
    </div>
  );
}

export function DateField({
  value,
  onChange,
  max = getTodayLocalDateISO(),
}: {
  value: string;
  onChange: (date: string) => void;
  max?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm font-semibold text-ink">Date</span>
      <input
        type="date"
        max={max}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (next) onChange(next);
        }}
        className={INPUT_CLS}
      />
    </label>
  );
}
