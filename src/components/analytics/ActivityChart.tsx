"use client";

import { useId, useState } from "react";
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
  chartLabel = "Load",
}: {
  data: DailyActivityPoint[];
  chartLabel?: string;
}) {
  const brand = useAccentColor();
  const { ink, muted, line, paper } = useSurfaceColors();
  const fillId = useId().replace(/:/g, "");
  const lastActive =
    [...data].reverse().find(
      (point) => point.gymLoad > 0 || point.sports > 0 || point.supplements > 0,
    ) ??
    data[data.length - 1] ??
    null;
  const [selected, setSelected] = useState<DailyActivityPoint | null>(lastActive);

  return (
    <section className={`${CARD_CLS} p-4`}>
      <h2 className={`${LABEL_CLS} mb-4`}>{chartLabel}</h2>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
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
              formatter={(value) => [`${value ?? 0}`, "Load"]}
            />
            <Bar
              dataKey="gymLoad"
              fill={`url(#${fillId})`}
              radius={[7, 7, 0, 0]}
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
        <div
          className="mt-4 grid grid-cols-4 gap-2 text-center"
          role="status"
        >
          <Readout label="Day" value={formatChartDate(selected.date)} />
          <Readout label="Load" value={String(selected.gymLoad)} />
          <Readout label="Sports" value={String(selected.sports)} />
          <Readout label="Supps" value={String(selected.supplements)} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">No days in this range.</p>
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
