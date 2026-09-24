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
import { formatLift } from "@/lib/catalog";
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

  if (exercises.length === 0) {
    return (
      <section className={`${CARD_CLS} border-dashed px-4 py-10 text-center`}>
        <h2 className={`${LABEL_CLS} mb-2`}>Progression</h2>
        <p className="text-sm text-muted">None yet.</p>
      </section>
    );
  }

  return (
    <section className={`${CARD_CLS} p-4`} aria-busy={isPending}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className={LABEL_CLS}>Progression</h2>
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

      <div className={`h-40 w-full ${isPending ? "opacity-60" : ""}`}>
        {points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No PR for this lift.
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
                  borderRadius: 14,
                  color: ink,
                  fontSize: 12,
                }}
                labelFormatter={(label) => formatChartDate(String(label))}
                formatter={(value, name) => [
                  value == null ? "—" : `${value} ${massUnit}`,
                  name === "estimatedOneRm" ? "Est. 1RM" : "PR",
                ]}
              />
              <Line
                type="monotone"
                dataKey="prWeight"
                stroke={brand}
                strokeWidth={2.4}
                dot={{ r: 3.5, fill: brand, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="estimatedOneRm"
                stroke={muted}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {picked ? (
        <p className="mt-4 text-sm text-ink" role="status">
          {formatChartDate(picked.date)}
          {picked.prWeight != null
            ? ` · ${formatLift(picked.prWeight, picked.prReps, massUnit, picked.dualWeights)}`
            : ""}
          {picked.estimatedOneRm != null
            ? ` · 1RM ${trimNumber(kgToDisplay(picked.estimatedOneRm, massUnit))}${massUnit}`
            : ""}
        </p>
      ) : null}
    </section>
  );
}

function toDisplayPoint(point: ProgressionPoint, unit: MassUnit): ProgressionPoint {
  return {
    ...point,
    prWeight: point.prWeight == null ? null : kgToDisplay(point.prWeight, unit),
    estimatedOneRm:
      point.estimatedOneRm == null ? null : kgToDisplay(point.estimatedOneRm, unit),
  };
}
