"use client";

import { useRef, useState } from "react";
import { addDaysISO, getTodayLocalDateISO, isDateKey } from "@/lib/calculations";
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
  const [pickingOther, setPickingOther] = useState(isOther);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectToday() {
    setPickingOther(false);
    onChange(today);
  }

  function selectYesterday() {
    setPickingOther(false);
    onChange(yesterday);
  }

  function openOther() {
    setPickingOther(true);
    window.setTimeout(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      try {
        input.showPicker();
      } catch {
        /* Visible date field is enough if the native picker cannot open. */
      }
    }, 0);
  }

  const showDateField = pickingOther || isOther;

  return (
    <div className="space-y-2">
      <div role="group" aria-label="Day" className="grid grid-cols-3 gap-1 rounded-xl bg-chip/80 p-1">
        <button
          type="button"
          onClick={selectToday}
          aria-pressed={isToday && !pickingOther}
          className={`${chipClass(isToday && !pickingOther)} flex min-h-11 items-center justify-center !rounded-lg text-sm`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={selectYesterday}
          aria-pressed={isYesterday && !pickingOther}
          className={`${chipClass(isYesterday && !pickingOther)} flex min-h-11 items-center justify-center !rounded-lg text-sm`}
        >
          Yesterday
        </button>
        <button
          type="button"
          onClick={openOther}
          aria-pressed={isOther || pickingOther}
          className={`${chipClass(isOther || pickingOther)} flex min-h-11 items-center justify-center !rounded-lg text-sm`}
        >
          Other
        </button>
      </div>
      {showDateField ? (
        <input
          ref={inputRef}
          type="date"
          max={today}
          value={isDateKey(date) ? date : ""}
          onChange={(event) => {
            const next = event.target.value;
            if (!next) {
              setPickingOther(false);
              onChange(today);
              return;
            }
            if (!isDateKey(next)) return;
            if (next === today || next === yesterday) setPickingOther(false);
            else setPickingOther(true);
            onChange(next);
          }}
          className={INPUT_CLS}
          aria-label="Pick a date"
        />
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
          if (next && isDateKey(next)) onChange(next);
        }}
        className={INPUT_CLS}
      />
    </label>
  );
}
