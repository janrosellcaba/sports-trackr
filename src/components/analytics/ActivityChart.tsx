"use client";

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
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

export function ActivityChart({ data }: { data: DailyActivityPoint[] }) {
  const brand = useAccentColor();
  const { ink, muted, line, paper } = useSurfaceColors();

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4">
        <h2 className={LABEL_CLS}>Volume</h2>
        <p className="mt-1 text-base font-bold text-ink">Kg lifted per day</p>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
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
              formatter={(value) => [`${value ?? 0} kg`, "Volume"]}
            />
            <Bar dataKey="volumeKg" fill={brand} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function formatShortDate(value: string): string {
  const parts = value.split("-");
  if (parts.length < 3) return value;
  return `${parts[1]}/${parts[2]}`;
}
