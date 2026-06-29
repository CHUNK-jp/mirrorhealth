"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { HealthSummary, DailyMetric } from "@/lib/healthParser";

interface Props {
  summary: HealthSummary;
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// Only show every 7th tick on X axis
function tickFormatter(val: string, idx: number) {
  return idx % 7 === 0 ? shortDate(val) : "";
}

const CHART_STYLE = {
  background: "transparent",
  fontSize: 11,
  fontFamily: "inherit",
};

const tooltipStyle = {
  backgroundColor: "#1f2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#f9fafb",
};

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}

// Filter out zero values for cleaner charts, keep structure
function nonZero(data: DailyMetric[]) {
  return data.map((d) => ({ ...d, value: d.value === 0 ? null : d.value }));
}

export function HealthCharts({ summary }: Props) {
  const last30 = (arr: DailyMetric[]) => arr.slice(-30);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Steps */}
      <ChartCard title="📶 Daily Steps (Last 30 Days)">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={last30(summary.steps)} style={CHART_STYLE} barSize={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} width={40} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v?.toLocaleString() + " steps", "Steps"]}
              labelFormatter={shortDate}
            />
            <ReferenceLine y={10000} stroke="#3b82f6" strokeDasharray="4 2" strokeOpacity={0.5} />
            <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Heart Rate */}
      <ChartCard title="❤️ Heart Rate (Last 30 Days)">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={nonZero(last30(summary.heartRate))} style={CHART_STYLE}>
            <defs>
              <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} width={35} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v + " bpm", "Heart Rate"]}
              labelFormatter={shortDate}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#ef4444"
              fill="url(#hrGrad)"
              strokeWidth={2}
              connectNulls={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Sleep */}
      <ChartCard title="🌙 Sleep Duration (Last 30 Days)">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={last30(summary.sleep)} style={CHART_STYLE} barSize={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} width={30} domain={[0, 12]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v + " hrs", "Sleep"]}
              labelFormatter={shortDate}
            />
            <ReferenceLine y={7} stroke="#a855f7" strokeDasharray="4 2" strokeOpacity={0.5} />
            <ReferenceLine y={9} stroke="#a855f7" strokeDasharray="4 2" strokeOpacity={0.5} />
            <Bar dataKey="value" fill="#a855f7" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* HRV */}
      <ChartCard title="💚 HRV (Last 30 Days)">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={nonZero(last30(summary.hrv))} style={CHART_STYLE}>
            <defs>
              <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} width={35} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v + " ms", "HRV"]}
              labelFormatter={shortDate}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              fill="url(#hrvGrad)"
              strokeWidth={2}
              connectNulls={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
