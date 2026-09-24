"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAccentColor, useSurfaceColors } from "@/components/theme/ThemeProvider";
import { useUnits } from "@/components/units/UnitsProvider";
import { formatChartDate } from "@/lib/calculations";
import { kgToDisplay, trimNumber, type MassUnit } from "@/lib/units";
import { weightChartDomain } from "@/lib/weight";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import type { WeightPoint } from "@/types/trackr";

type DisplayPoint = {
  date: string;
  weight: number;
};

export function WeightChart({ points }: { points: WeightPoint[] }) {
  const brand = useAccentColor();
  const { ink, muted, line, paper } = useSurfaceColors();
  const { massUnit } = useUnits();
  const displayPoints = points.map((point) => toDisplayPoint(point, massUnit));
  const domain = weightChartDomain(displayPoints.map((point) => point.weight));
  const [picked, setPicked] = useState<DisplayPoint | null>(
    displayPoints[displayPoints.length - 1] ?? null,
  );

  return (
    <section className={`${CARD_CLS} p-4`}>
      <h2 className={`${LABEL_CLS} mb-4`}>Body weight</h2>

      <div className="h-36 w-full">
        {displayPoints.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            None in this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayPoints}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              onClick={(state) => {
                const payload = (
                  state as { activePayload?: Array<{ payload?: DisplayPoint }> } | undefined
                )?.activePayload?.[0]?.payload;
                if (payload?.date) setPicked(payload);
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
                width={44}
                domain={domain ?? ["auto", "auto"]}
                tick={{ fill: muted, fontSize: 11 }}
                tickFormatter={(value) => trimNumber(Number(value))}
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
                formatter={(value) => [
                  value == null ? "—" : `${trimNumber(Number(value))}${massUnit}`,
                  "Weight",
                ]}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke={brand}
                strokeWidth={2.4}
                isAnimationActive={false}
                dot={{ r: 3.5, fill: brand, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {picked ? (
        <p className="mt-4 text-sm text-ink" role="status">
          {formatChartDate(picked.date)}
          {` · ${trimNumber(picked.weight)}${massUnit}`}
          {formatChange(displayPoints, picked, massUnit)}
        </p>
      ) : null}

      <table className="sr-only">
        <caption>Body weight over time</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {displayPoints.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>
                {point.weight}
                {massUnit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function toDisplayPoint(point: WeightPoint, unit: MassUnit): DisplayPoint {
  return {
    date: point.date,
    weight: kgToDisplay(point.weightKg, unit),
  };
}

function formatChange(
  points: DisplayPoint[],
  picked: DisplayPoint,
  unit: MassUnit,
): string {
  const index = points.findIndex((point) => point.date === picked.date);
  const previous = index > 0 ? points[index - 1] : null;
  if (!previous) return "";
  const delta = Math.round((picked.weight - previous.weight) * 100) / 100;
  if (delta === 0) return ` · 0${unit}`;
  const sign = delta > 0 ? "+" : "−";
  return ` · ${sign}${trimNumber(Math.abs(delta))}${unit}`;
}
