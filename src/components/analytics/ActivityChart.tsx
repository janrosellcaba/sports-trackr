"use client";

import { useId, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyActivityPoint } from "@/types/trackr";
import { useAccentColor, useSurfaceColors } from "@/components/theme/ThemeProvider";
import { formatChartDate } from "@/lib/calculations";
import { perWeekRate } from "@/lib/analytics";
import { trimNumber } from "@/lib/units";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

type ChartPoint = DailyActivityPoint & { sportMark: number | null };

export function ActivityChart({
  data,
  chartLabel = "Activity",
}: {
  data: DailyActivityPoint[];
  chartLabel?: string;
}) {
  const brand = useAccentColor();
  const { ink, muted, line, paper } = useSurfaceColors();
  const fillId = useId().replace(/:/g, "");
  const chartData = withSportMarks(data);
  const lastActive =
    [...data].reverse().find(
      (point) => point.gymLoad > 0 || point.sports > 0 || point.supplements > 0,
    ) ??
    data[data.length - 1] ??
    null;
  const [selected, setSelected] = useState<DailyActivityPoint | null>(lastActive);
  const gymDays = data.filter((point) => point.workouts > 0).length;
  const sportDays = data.filter((point) => point.sports > 0).length;
  const sportPerWeek = perWeekRate(sportDays, data.length);

  function pick(point: DailyActivityPoint | undefined) {
    if (point) setSelected(point);
  }

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={LABEL_CLS}>{chartLabel}</h2>
          <p className="mt-1 text-[11px] text-muted">
            {gymDays} gym · {sportDays} sport
            {sportPerWeek != null ? ` · ${trimNumber(sportPerWeek)} sport/wk` : ""}
          </p>
        </div>
        <p className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2.5 rounded-sm bg-brand" />
            Gym
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full border-2 border-brand bg-paper"
              aria-hidden="true"
            />
            Sport
          </span>
        </p>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 4, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brand} stopOpacity={1} />
                <stop offset="100%" stopColor={brand} stopOpacity={0.38} />
              </linearGradient>
            </defs>
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
                borderRadius: 14,
                color: ink,
                fontSize: 12,
                boxShadow: "var(--shadow-card)",
              }}
              labelFormatter={(label) => formatChartDate(String(label))}
              formatter={(value, name) => {
                if (name === "sportMark") return ["Yes", "Sport"];
                return [`${value ?? 0}`, "Load"];
              }}
            />
            <Bar
              dataKey="gymLoad"
              fill={`url(#${fillId})`}
              radius={[7, 7, 0, 0]}
              onClick={(entry) => {
                pick((entry as { payload?: DailyActivityPoint }).payload);
              }}
            />
            <Scatter
              dataKey="sportMark"
              fill={paper}
              stroke={brand}
              strokeWidth={2}
              tooltipType="none"
              shape={(props) => (
                <SportDot
                  cx={props.cx}
                  cy={props.cy}
                  payload={props.payload as ChartPoint | undefined}
                  fill={paper}
                  stroke={brand}
                />
              )}
              onClick={(entry) => {
                pick((entry as { payload?: DailyActivityPoint }).payload);
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {selected ? (
        <div className="mt-4 grid grid-cols-4 gap-2 text-center" role="status">
          <Readout label="Day" value={formatChartDate(selected.date)} />
          <Readout label="Load" value={String(selected.gymLoad)} />
          <Readout label="Gym" value={selected.workouts > 0 ? "Yes" : "—"} />
          <Readout label="Sport" value={selected.sports > 0 ? "Yes" : "—"} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">No days in this range.</p>
      )}

      <table className="sr-only">
        <caption>Daily gym load and sport days</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Gym load</th>
            <th>Gym</th>
            <th>Sports</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{point.gymLoad}</td>
              <td>{point.workouts}</td>
              <td>{point.sports}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

type SportDotProps = {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  fill: string;
  stroke: string;
};

function SportDot({ cx, cy, payload, fill, stroke }: SportDotProps) {
  if (cx == null || cy == null || !payload?.sports) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill={fill}
      stroke={stroke}
      strokeWidth={2}
    />
  );
}

function withSportMarks(data: DailyActivityPoint[]): ChartPoint[] {
  const maxLoad = Math.max(0, ...data.map((point) => point.gymLoad));
  const floor = Math.max(1, Math.round(maxLoad * 0.12) || 1);
  return data.map((point) => ({
    ...point,
    sportMark: point.sports > 0 ? Math.max(point.gymLoad, floor) : null,
  }));
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-chip/70 px-1.5 py-2">
      <p className="truncate font-display text-sm font-bold tabular-nums text-ink">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
        {label}
      </p>
    </div>
  );
}
