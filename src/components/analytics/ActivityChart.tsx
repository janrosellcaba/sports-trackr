"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyActivityPoint } from "@/types/trackr";
import { useAccentColor, useSurfaceColors } from "@/components/theme/ThemeProvider";
import { formatChartDate } from "@/lib/calculations";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

export function ActivityChart({
  data,
  chartLabel = "Gym load",
}: {
  data: DailyActivityPoint[];
  chartLabel?: string;
}) {
  const brand = useAccentColor();
  const { ink, muted, line, paper } = useSurfaceColors();
  const lastActive =
    [...data].reverse().find(
      (point) => point.gymLoad > 0 || point.sports > 0 || point.supplements > 0,
    ) ??
    data[data.length - 1] ??
    null;
  const [selected, setSelected] = useState<DailyActivityPoint | null>(lastActive);

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4">
        <h2 className={LABEL_CLS}>{chartLabel}</h2>
        <p className="mt-1 text-xs text-muted">
          Bars are gym intensity sum (1–5 per muscle). Tap a day for the breakdown.
        </p>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
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
              allowDecimals={false}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                background: paper,
                border: `1px solid ${line}`,
                borderRadius: 12,
                color: ink,
                fontSize: 12,
              }}
              labelFormatter={(label) => formatChartDate(String(label))}
              formatter={(value) => [`${value ?? 0}`, "Gym load"]}
            />
            <Bar
              dataKey="gymLoad"
              fill={brand}
              radius={[6, 6, 0, 0]}
              onClick={(entry) => {
                const payload = (
                  entry as { payload?: DailyActivityPoint }
                ).payload;
                if (payload) setSelected(payload);
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selected ? (
        <p className="mt-3 text-sm text-ink" role="status">
          {formatChartDate(selected.date)} · gym load {selected.gymLoad} ·{" "}
          {selected.workouts} gym session{selected.workouts === 1 ? "" : "s"} ·{" "}
          {selected.sports} sport{selected.sports === 1 ? "" : "s"} ·{" "}
          {selected.supplements} supplement
          {selected.supplements === 1 ? "" : "s"}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">No days in this range.</p>
      )}

      <table className="sr-only">
        <caption>Daily gym load</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Gym load</th>
            <th>Sports</th>
            <th>Supplements</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{point.gymLoad}</td>
              <td>{point.sports}</td>
              <td>{point.supplements}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
