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

type ExerciseProgressionChartProps = {
  exerciseNames: string[];
  initialName?: string;
};

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
      <section className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 px-4 py-8 text-center">
        <p className="text-sm text-neutral-400">
          Log a few gym sets to unlock strength progression charts.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
            Progression
          </h2>
          <p className="mt-1 text-base font-semibold text-neutral-100">
            Strength over time
          </p>
        </div>
        <label className="block w-full sm:w-56">
          <span className="sr-only">Exercise</span>
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none focus:border-lime-400/40"
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
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            No sets recorded for this exercise yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fill: "#737373", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: "#737373", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0a0a0a",
                  border: "1px solid #262626",
                  borderRadius: 12,
                  color: "#f5f5f5",
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
                stroke="#a3e635"
                strokeWidth={2}
                dot={{ r: 3, fill: "#a3e635" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="estimatedOneRm"
                stroke="#34d399"
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
