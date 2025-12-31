"use client";

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PieChart } from "lucide-react";

const COLORS = [
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#F59E0B", // amber
  "#10B981", // green
  "#3B82F6", // blue
  "#EF4444", // red
  "#06B6D4", // cyan
  "#F97316", // orange
];

interface ArcChartProps {
  title: string;
  data: Array<{ name: string; value: number; [key: string]: any }>;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export default function ArcChart({
  title,
  data,
  height = 300,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 120,
}: ArcChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          {title}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const filteredData = data.filter((item) => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          {title}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5" />
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
            labelLine={false}
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined, props: any) => [
              value ? `₹${value.toLocaleString()}` : '₹0',
              props.payload?.name || name || '',
            ]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px",
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value}: ₹{entry.payload.value.toLocaleString()}
                </span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
      {total > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">₹{total.toLocaleString()}</span>
          </p>
        </div>
      )}
    </div>
  );
}

