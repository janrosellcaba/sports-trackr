"use client";

import { useId } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyActivityPoint } from "@/types/trackr";
import { useAccentColor, useSurfaceColors } from "@/components/theme/ThemeProvider";
import { formatChartDate } from "@/lib/calculations";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

type ChartPoint = DailyActivityPoint & { column: number };

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
  const hatchId = `${fillId}-hatch`;
  const yMax = chartYMax(data);
  const chartData = data.map((point) => ({ ...point, column: yMax }));

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className={LABEL_CLS}>{chartLabel}</h2>
        <p className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2.5 rounded-sm bg-brand" />
            Gym
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2.5 rounded-[2px] ring-1 ring-brand/40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, var(--accent-primary) 0 1px, transparent 1px 5px)",
              }}
            />
            Sport
          </span>
        </p>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brand} stopOpacity={1} />
                <stop offset="100%" stopColor={brand} stopOpacity={0.38} />
              </linearGradient>
              <pattern
                id={hatchId}
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="10"
                  stroke={brand}
                  strokeWidth="1.2"
                  strokeOpacity="0.9"
                />
              </pattern>
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
              domain={[0, yMax]}
              ticks={yTicks(yMax)}
              tick={{ fill: muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: brand, fillOpacity: 0.08, radius: 6 }}
              content={<ActivityTooltip paper={paper} line={line} ink={ink} muted={muted} />}
            />
            <Bar
              dataKey="column"
              legendType="none"
              isAnimationActive={false}
              background={{ fill: "transparent" }}
              shape={(props) => {
                const bg = (
                  props as { background?: { y?: number; height?: number } }
                ).background;
                return (
                  <ActivityColumn
                    x={props.x}
                    y={props.y}
                    width={props.width}
                    height={props.height}
                    plotY={bg?.y}
                    plotHeight={bg?.height}
                    payload={chartPointFrom(props.payload)}
                    fill={`url(#${fillId})`}
                    hatch={`url(#${hatchId})`}
                    stroke={brand}
                    active={Boolean((props as { isActive?: boolean }).isActive)}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {data.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No days in this range.</p>
      ) : null}

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

function ActivityTooltip({
  active,
  payload,
  paper,
  line,
  ink,
  muted,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DailyActivityPoint }>;
  paper: string;
  line: string;
  ink: string;
  muted: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div
      className="min-w-[9.5rem] rounded-2xl px-3 py-2.5 text-xs shadow-[var(--shadow-card)]"
      style={{ background: paper, border: `1px solid ${line}`, color: ink }}
    >
      <p className="font-display text-sm font-bold">{formatChartDate(point.date)}</p>
      <p className="mt-1.5 tabular-nums" style={{ color: muted }}>
        Load {point.gymLoad}
        {" · "}
        Gym {point.workouts > 0 ? "yes" : "—"}
        {" · "}
        Sport {point.sports > 0 ? "yes" : "—"}
      </p>
    </div>
  );
}

type ActivityColumnProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  plotY?: number;
  plotHeight?: number;
  payload?: ChartPoint;
  fill: string;
  hatch: string;
  stroke: string;
  active: boolean;
};

function ActivityColumn({
  x,
  y,
  width,
  height,
  plotY,
  plotHeight,
  payload,
  fill,
  hatch,
  stroke,
  active,
}: ActivityColumnProps) {
  if (!payload) return null;
  const left = Number(x);
  const band = Number(width);
  const plotTop = Number.isFinite(Number(plotY)) ? Number(plotY) : Number(y);
  const plotTall =
    Number.isFinite(Number(plotHeight)) && Number(plotHeight) > 0
      ? Number(plotHeight)
      : Number(height);
  if (![left, plotTop, band, plotTall].every(Number.isFinite) || plotTall <= 0) {
    return null;
  }

  const gymHeight =
    payload.gymLoad > 0
      ? (payload.gymLoad / Math.max(payload.column, 1)) * plotTall
      : 0;
  const hadSport = payload.sports > 0;
  const gymTop = plotTop + plotTall - gymHeight;
  const gymPath = roundedTopBar(left, gymTop, band, gymHeight, 7);
  const sportPath = squareBar(left, plotTop, band, plotTall);

  return (
    <g>
      {active ? (
        <rect
          x={left}
          y={plotTop}
          width={band}
          height={plotTall}
          fill={stroke}
          fillOpacity={0.08}
          rx={hadSport ? 0 : 6}
        />
      ) : null}
      {hadSport ? <path d={sportPath} fill={stroke} fillOpacity={0.14} /> : null}
      {gymHeight > 0 ? (
        <path d={gymPath} fill={fill} opacity={active ? 1 : 0.92} />
      ) : null}
      {hadSport ? <path d={sportPath} fill={hatch} /> : null}
    </g>
  );
}

function chartPointFrom(value: unknown): ChartPoint | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as ChartPoint & { payload?: ChartPoint };
  if (typeof row.date === "string") return row;
  if (row.payload && typeof row.payload.date === "string") return row.payload;
  return undefined;
}

function squareBar(x: number, y: number, width: number, height: number): string {
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y}`,
    `L ${x + width} ${y}`,
    `L ${x + width} ${y + height}`,
    "Z",
  ].join(" ");
}

function roundedTopBar(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  const r = Math.min(radius, width / 2, height);
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    "Z",
  ].join(" ");
}

function chartYMax(data: DailyActivityPoint[]): number {
  const maxLoad = Math.max(0, ...data.map((point) => point.gymLoad));
  const n = Math.max(4, maxLoad);
  if (n <= 8) return Math.ceil(n / 2) * 2;
  if (n <= 20) return Math.ceil(n / 4) * 4;
  if (n <= 40) return Math.ceil(n / 6) * 6;
  return Math.ceil(n / 10) * 10;
}

function yTicks(max: number): number[] {
  const step = max / 4;
  return [0, step, step * 2, step * 3, max];
}
