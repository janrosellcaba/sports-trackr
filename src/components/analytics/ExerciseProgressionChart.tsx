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
import type { ProgressionPoint } from "@/types/trackr";
import { CARD_CLS, INPUT_CLS, LABEL_CLS } from "@/lib/ui";

type ExerciseProgressionChartProps = {
  exerciseNames: string[];
  initialName?: string;
};

const BRAND = "#1f7a54";
const MUTED = "#918c7c";
const LINE = "#e9e4d6";
const PAPER = "#fffdf8";
const INK = "#23221d";

export function ExerciseProgressionChart({
  exerciseNames,
  initialName,
}: ExerciseProgressionChartProps) {
  const [selected, setSelected] = useState(
    initialName ?? exerciseNames[0] ?? "",
  );
  const [points, setPoints] = useState<ProgressionPoint[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selected) {
      setPoints([]);
      return;
    }

    startTransition(async () => {
      const data = await getExerciseProgression(selected);
      setPoints(data);
    });
  }, [selected]);

  if (exerciseNames.length === 0) {
    return (
      <section className={`${CARD_CLS} border-dashed px-4 py-8 text-center`}>
        <p className="text-sm text-muted">
          Log a few gym sets to unlock strength progression charts.
        </p>
      </section>
    );
  }

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className={LABEL_CLS}>Progression</h2>
          <p className="mt-1 text-base font-bold text-ink">Strength over time</p>
        </div>
        <label className="block w-full sm:w-56">
          <span className="sr-only">Exercise</span>
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className={INPUT_CLS}
          >
            {exerciseNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`h-56 w-full ${isPending ? "opacity-60" : ""}`}>
        {points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No sets recorded for this exercise yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fill: MUTED, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: MUTED, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: PAPER,
                  border: `1px solid ${LINE}`,
                  borderRadius: 12,
                  color: INK,
                  fontSize: 12,
                }}
                labelFormatter={(label) => formatShortDate(String(label))}
                formatter={(value, name) => [
                  `${value ?? 0} kg`,
                  name === "estimatedOneRm" ? "Est. 1RM" : "Max weight",
                ]}
              />
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke={BRAND}
                strokeWidth={2}
                dot={{ r: 3, fill: BRAND }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="estimatedOneRm"
                stroke={MUTED}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function formatShortDate(value: string): string {
  const [, month, day] = value.split("-");
  return `${month}/${day}`;
}
