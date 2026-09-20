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

type ChartPoint = DailyActivityPoint & { column: number };

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
  const chartData = withColumns(data);
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
            onMouseMove={(state) => {
              pick(
                (
                  state as { activePayload?: Array<{ payload?: DailyActivityPoint }> }
                ).activePayload?.[0]?.payload,
              );
            }}
            onClick={(state) => {
              pick(
                (
                  state as { activePayload?: Array<{ payload?: DailyActivityPoint }> }
                ).activePayload?.[0]?.payload,
              );
            }}
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
              cursor={{ fill: brand, fillOpacity: 0.08, radius: 6 }}
              content={<ActivityTooltip paper={paper} line={line} ink={ink} muted={muted} />}
            />
            <Bar
              dataKey="column"
              legendType="none"
              isAnimationActive={false}
              shape={(props) => (
                <ActivityColumn
                  x={props.x}
                  y={props.y}
                  width={props.width}
                  height={props.height}
                  payload={chartPointFrom(props.payload)}
                  fill={`url(#${fillId})`}
                  stroke={brand}
                  active={Boolean(
                    (props as { isActive?: boolean }).isActive,
                  )}
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
  payload?: ChartPoint;
  fill: string;
  stroke: string;
  active: boolean;
};

function ActivityColumn({
  x,
  y,
  width,
  height,
  payload,
  fill,
  stroke,
  active,
}: ActivityColumnProps) {
  if (!payload) return null;
  const left = Number(x);
  const top = Number(y);
  const band = Number(width);
  const tall = Number(height);
  if (![left, top, band, tall].every(Number.isFinite) || tall <= 0) return null;

  const gymHeight =
    payload.gymLoad > 0
      ? (payload.gymLoad / Math.max(payload.column, 1)) * tall
      : 0;
  const gymTop = top + tall - gymHeight;
  const cx = left + band / 2;
  const hadSport = payload.sports > 0;
  const stitchTop = top + 3;
  const stitchBottom = top + tall - 1;

  return (
    <g>
      {hadSport ? (
        <rect
          x={left}
          y={top}
          width={band}
          height={tall}
          fill={stroke}
          fillOpacity={active ? 0.2 : 0.12}
          rx={6}
        />
      ) : active ? (
        <rect
          x={left}
          y={top}
          width={band}
          height={tall}
          fill={stroke}
          fillOpacity={0.08}
          rx={6}
        />
      ) : null}
      {gymHeight > 0 ? (
        <path
          d={roundedTopBar(left, gymTop, band, gymHeight, 7)}
          fill={fill}
          opacity={active ? 1 : 0.92}
        />
      ) : null}
      {hadSport ? (
        <line
          x1={cx}
          y1={stitchTop}
          x2={cx}
          y2={stitchBottom}
          stroke={stroke}
          strokeOpacity={active ? 1 : 0.95}
          strokeWidth={Math.max(2, Math.min(2.6, band * 0.18))}
          strokeLinecap="round"
          strokeDasharray={band < 8 ? "2.2 3.2" : "3 4.2"}
        />
      ) : null}
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

function withColumns(data: DailyActivityPoint[]): ChartPoint[] {
  const maxLoad = Math.max(0, ...data.map((point) => point.gymLoad));
  const rail = Math.max(1, maxLoad);
  return data.map((point) => ({
    ...point,
    column: rail,
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
