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
import type { DailyActivityPoint } from "@/types/trackr";
import { useAccentColor, useSurfaceColors } from "@/components/theme/ThemeProvider";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

type ActivityChartProps = {
  data: DailyActivityPoint[];
};

export function ActivityChart({ data }: ActivityChartProps) {
  const brand = useAccentColor();
  const { ink, muted, line, paper } = useSurfaceColors();
  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className={LABEL_CLS}>Activity</h2>
          <p className="mt-1 text-base font-bold text-ink">Daily load</p>
        </div>
        <div className="flex gap-3 text-[11px] font-medium text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Gym min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink" />
            Cardio min
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gymFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brand} stopOpacity={0.28} />
                <stop offset="100%" stopColor={brand} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="cardioFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ink} stopOpacity={0.18} />
                <stop offset="100%" stopColor={ink} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={line} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
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
              contentStyle={{
                background: paper,
                border: `1px solid ${line}`,
                borderRadius: 12,
                color: ink,
                fontSize: 12,
              }}
              labelFormatter={(label) => formatShortDate(String(label))}
              formatter={(value, name) => [
                `${value ?? 0} min`,
                name === "gymMinutes" ? "Gym" : "Cardio",
              ]}
            />
            <Area
              type="monotone"
              dataKey="gymMinutes"
              stackId="minutes"
              stroke={brand}
              fill="url(#gymFill)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="cardioMinutes"
              stackId="minutes"
              stroke={ink}
              fill="url(#cardioFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function formatShortDate(value: string): string {
  const [, month, day] = value.split("-");
  return `${month}/${day}`;
}
