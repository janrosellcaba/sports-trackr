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
import type { DailyActivityPoint } from "@/app/actions/analytics";

type ActivityChartProps = {
  data: DailyActivityPoint[];
};

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
            Activity
          </h2>
          <p className="mt-1 text-base font-semibold text-neutral-100">
            Daily load
          </p>
        </div>
        <div className="flex gap-3 text-[11px] text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-lime-400" />
            Gym min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Cardio min
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gymFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a3e635" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#a3e635" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="cardioFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fill: "#737373", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: "#737373", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0a0a0a",
                border: "1px solid #262626",
                borderRadius: 12,
                color: "#f5f5f5",
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
              stroke="#a3e635"
              fill="url(#gymFill)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="cardioMinutes"
              stackId="minutes"
              stroke="#10b981"
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
