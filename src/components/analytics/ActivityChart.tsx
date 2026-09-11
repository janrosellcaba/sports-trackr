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
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

type ActivityChartProps = {
  data: DailyActivityPoint[];
};

const BRAND = "#1f7a54";
const INK = "#23221d";
const MUTED = "#918c7c";
const LINE = "#e9e4d6";
const PAPER = "#fffdf8";

export function ActivityChart({ data }: ActivityChartProps) {
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
                <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
                <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="cardioFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INK} stopOpacity={0.18} />
                <stop offset="100%" stopColor={INK} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fill: MUTED, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: MUTED, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: PAPER,
                border: `1px solid ${LINE}`,
                borderRadius: 12,
                color: INK,
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
              stroke={BRAND}
              fill="url(#gymFill)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="cardioMinutes"
              stackId="minutes"
              stroke={INK}
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
