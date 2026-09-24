"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAccentColor, useSurfaceColors } from "@/components/theme/ThemeProvider";
import { formatChartDate } from "@/lib/calculations";
import { shapeReadout, type ShapePoint } from "@/lib/shape";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

export function ShapeChart({ points }: { points: ShapePoint[] }) {
  const brand = useAccentColor();
  const { ink, muted, line, paper } = useSurfaceColors();
  const readout = shapeReadout(points);
  const displayPoints = points.map((point) => ({
    date: point.date,
    score: Math.round(point.score),
  }));

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className={LABEL_CLS}>Shape</h2>
          <p className="mt-1 text-[11px] text-muted">All time</p>
        </div>
        {readout ? (
          <p className="text-right">
            <span className="font-display text-2xl leading-none font-extrabold tabular-nums text-ink">
              {readout.score}
            </span>
            <span className="mt-1 block text-[11px] font-semibold text-muted">
              {weekChangeLabel(readout.weekChange)}
            </span>
          </p>
        ) : null}
      </div>

      <div className="h-44 w-full">
        {displayPoints.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Log gym or sport to see your shape.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={displayPoints}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
                width={40}
                domain={[0, "dataMax"]}
                tick={{ fill: muted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
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
                formatter={(value) => [value == null ? "—" : String(value), "Shape"]}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={brand}
                strokeWidth={2.4}
                fill={brand}
                fillOpacity={0.18}
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <table className="sr-only">
        <caption>Shape over time</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {displayPoints.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{point.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function weekChangeLabel(change: number | null): string {
  if (change == null) return "This week";
  if (change > 0) return `+${change} this week`;
  if (change < 0) return `−${Math.abs(change)} this week`;
  return "0 this week";
}
