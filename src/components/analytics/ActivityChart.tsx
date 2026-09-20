"use client";

import { useId, useState } from "react";
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

type ChartPoint = DailyActivityPoint & { sportMark: number };

export function ActivityChart({
  data,
  chartLabel = "Load",
}: {
  data: DailyActivityPoint[];
  chartLabel?: string;
}) {
  const brand = useAccentColor();
  const { ink, muted, line, paper } = useSurfaceColors();
  const fillId = useId().replace(/:/g, "");
  const glowId = `${fillId}-glow`;
  const chartData = withSportMarks(data);
  const lastActive =
    [...data].reverse().find(
      (point) => point.gymLoad > 0 || point.sports > 0 || point.supplements > 0,
    ) ??
    data[data.length - 1] ??
    null;
  const [selected, setSelected] = useState<DailyActivityPoint | null>(lastActive);

  function pick(point: DailyActivityPoint | undefined) {
    if (point) setSelected(point);
  }

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className={LABEL_CLS}>{chartLabel}</h2>
        <p className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2.5 rounded-sm bg-brand" />
            Gym
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="8" height="14" aria-hidden="true" className="text-brand/80">
              <line
                x1="4"
                y1="1"
                x2="4"
                y2="13"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="2.2 2.8"
              />
            </svg>
            Sport
          </span>
        </p>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 4, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brand} stopOpacity={1} />
                <stop offset="100%" stopColor={brand} stopOpacity={0.38} />
              </linearGradient>
              <filter id={glowId} x="-80%" y="-12%" width="260%" height="124%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
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
              formatter={(_value, _name, item) => {
                const point = (item as { payload?: DailyActivityPoint }).payload;
                return [`${point?.gymLoad ?? 0}`, "Load"];
              }}
            />
            <Bar
              dataKey="sportMark"
              legendType="none"
              isAnimationActive={false}
              shape={(props) => (
                <ActivityColumn
                  x={props.x}
                  y={props.y}
                  width={props.width}
                  height={props.height}
                  payload={props.payload as ChartPoint | undefined}
                  fill={`url(#${fillId})`}
                  stroke={brand}
                  glowId={glowId}
                  onPick={pick}
                />
              )}
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

type ActivityColumnProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  payload?: ChartPoint;
  fill: string;
  stroke: string;
  glowId: string;
  onPick: (point: DailyActivityPoint | undefined) => void;
};

function ActivityColumn({
  x,
  y,
  width,
  height,
  payload,
  fill,
  stroke,
  glowId,
  onPick,
}: ActivityColumnProps) {
  if (!payload) return null;
  const left = Number(x);
  const top = Number(y);
  const band = Number(width);
  const tall = Number(height);
  if (![left, top, band, tall].every(Number.isFinite) || tall <= 0) return null;

  const gymHeight =
    payload.gymLoad > 0
      ? (payload.gymLoad / Math.max(payload.sportMark, 1)) * tall
      : 0;
  const gymTop = top + tall - gymHeight;
  const cx = left + band / 2;
  const dash = band < 9 ? "2 3.4" : "2.4 4.2";
  const stitchTop = top + Math.min(8, tall * 0.08);
  const stitchBottom = top + tall - 1;

  return (
    <g onClick={() => onPick(payload)}>
      <rect x={left} y={top} width={band} height={tall} fill="transparent" />
      {gymHeight > 0 ? (
        <path d={roundedTopBar(left, gymTop, band, gymHeight, 7)} fill={fill} />
      ) : null}
      {payload.sports > 0 ? (
        <g filter={`url(#${glowId})`}>
          <line
            x1={cx}
            y1={stitchTop}
            x2={cx}
            y2={stitchBottom}
            stroke={stroke}
            strokeOpacity={0.28}
            strokeWidth={Math.min(5, Math.max(3, band * 0.22))}
            strokeLinecap="round"
          />
          <line
            x1={cx}
            y1={stitchTop}
            x2={cx}
            y2={stitchBottom}
            stroke={stroke}
            strokeOpacity={0.92}
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeDasharray={dash}
          />
        </g>
      ) : null}
    </g>
  );
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

function withSportMarks(data: DailyActivityPoint[]): ChartPoint[] {
  const maxLoad = Math.max(0, ...data.map((point) => point.gymLoad));
  const rail = Math.max(1, maxLoad);
  return data.map((point) => ({
    ...point,
    sportMark: rail,
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
