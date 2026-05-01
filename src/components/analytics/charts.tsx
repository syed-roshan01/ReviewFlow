"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type TrendPoint = {
  date: string;
  sent: number;
  converted: number;
  negative: number;
};

type RatingCount = { star: number; count: number };

export function AnalyticsCharts({
  trend,
  ratingCounts,
}: {
  trend: TrendPoint[];
  ratingCounts: RatingCount[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 30-day trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          30-Day Review Trend
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Line
              type="monotone"
              dataKey="sent"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Sent"
            />
            <Line
              type="monotone"
              dataKey="converted"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="Converted"
            />
            <Line
              type="monotone"
              dataKey="negative"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Negative"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rating distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          Rating Distribution
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={ratingCounts.map((r) => ({
              name: `${r.star}★`,
              count: r.count,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="count"
              name="Responses"
              radius={[4, 4, 0, 0]}
              fill="#3b82f6"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
