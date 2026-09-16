"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getExerciseProgression } from "@/app/actions/analytics";
import { useAccentColor, useSurfaceColors } from "@/components/theme/ThemeProvider";
import { useUnits } from "@/components/units/UnitsProvider";
import { formatChartDate } from "@/lib/calculations";
import { kgToDisplay, trimNumber, type MassUnit } from "@/lib/units";
import type { NotebookExercise, ProgressionPoint } from "@/types/trackr";
import { CARD_CLS, LABEL_CLS, SELECT_CLS } from "@/lib/ui";

export function ExerciseProgressionChart({
  exercises,
  initialId,
}: {
  exercises: NotebookExercise[];
  initialId?: string;
}) {
  const brand = useAccentColor();
  const { ink, muted, line, paper } = useSurfaceColors();
  const { massUnit } = useUnits();
  const [selected, setSelected] = useState(initialId ?? exercises[0]?.id ?? "");
  const [points, setPoints] = useState<ProgressionPoint[]>([]);
  const [picked, setPicked] = useState<ProgressionPoint | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    startTransition(async () => {
      const data = await getExerciseProgression(selected);
      if (cancelled) return;
      setPoints(data);
      setPicked(data[data.length - 1] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const displayPoints = points.map((point) => toDisplayPoint(point, massUnit));
  const displayPicked = picked ? toDisplayPoint(picked, massUnit) : null;

  if (exercises.length === 0) {
    return (
      <section className={`${CARD_CLS} border-dashed px-4 py-8 text-center`}>
        <p className="text-sm text-muted">
          Log a personal record from Home to see strength over time.
        </p>
      </section>
    );
  }

  return (
    <section className={`${CARD_CLS} p-4`} aria-busy={isPending}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className={LABEL_CLS}>Progression</h2>
          <p className="mt-1 text-xs text-muted">
            Snapshots from personal records and working sets, in {massUnit}.
          </p>
        </div>
        <label className="block w-full sm:w-56">
          <span className="sr-only">Exercise</span>
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className={SELECT_CLS}
          >
            {exercises.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`h-56 w-full ${isPending ? "opacity-60" : ""}`}>
        {points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No working weight or PR recorded for this lift yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayPoints}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              onClick={(state) => {
                const payload = (
                  state as { activePayload?: Array<{ payload?: ProgressionPoint }> } | undefined
                )?.activePayload?.[0]?.payload;
                if (payload?.date) {
                  const original = points.find((item) => item.date === payload.date);
                  if (original) setPicked(original);
                }
              }}
            >
              <CartesianGrid stroke={line} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                tick={{ fill: muted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: muted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: paper,
                  border: `1px solid ${line}`,
                  borderRadius: 12,
                  color: ink,
                  fontSize: 12,
                }}
                labelFormatter={(label) => formatChartDate(String(label))}
                formatter={(value, name) => [
                  value == null ? "—" : `${value} ${massUnit}`,
                  name === "estimatedOneRm"
                    ? "Est. 1RM"
                    : name === "prWeight"
                      ? "PR"
                      : "Working",
                ]}
              />
              <Line
                type="monotone"
                dataKey="workingWeight"
                stroke={brand}
                strokeWidth={2}
                dot={{ r: 3, fill: brand }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="prWeight"
                stroke={muted}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {displayPicked ? (
        <p className="mt-3 text-sm text-ink" role="status">
          {formatChartDate(displayPicked.date)}
          {displayPicked.workingWeight != null
            ? ` · working ${trimNumber(displayPicked.workingWeight)}${massUnit}`
            : ""}
          {displayPicked.prWeight != null
            ? ` · PR ${trimNumber(displayPicked.prWeight)}${massUnit}`
            : ""}
          {displayPicked.estimatedOneRm != null
            ? ` · est. 1RM ${trimNumber(displayPicked.estimatedOneRm)}${massUnit}`
            : ""}
        </p>
      ) : null}
    </section>
  );
}

function toDisplayPoint(point: ProgressionPoint, unit: MassUnit): ProgressionPoint {
  return {
    ...point,
    workingWeight:
      point.workingWeight == null ? null : kgToDisplay(point.workingWeight, unit),
    prWeight: point.prWeight == null ? null : kgToDisplay(point.prWeight, unit),
    estimatedOneRm:
      point.estimatedOneRm == null ? null : kgToDisplay(point.estimatedOneRm, unit),
  };
}
