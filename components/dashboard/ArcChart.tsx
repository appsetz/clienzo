"use client";

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PieChart } from "lucide-react";

const COLORS = [
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#f97316", // orange
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
  outerRadius = 100,
}: ArcChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-teal-600" />
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-teal-600" />
          {title}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-teal-600" />
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
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
            labelLine={false}
          >
            {filteredData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined, props: any) => [
              value !== undefined ? (typeof value === 'number' && value > 1000 ? `₹${value.toLocaleString()}` : value) : '0',
              props.payload?.name || name || '',
            ]}
            contentStyle={{
              backgroundColor: "white",
              border: "none",
              borderRadius: "12px",
              padding: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-700">
                  {value}: {entry.payload.value}
                </span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
      {total > 0 && (
        <div className="mt-4 text-center border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-900">{total}</span> items
          </p>
        </div>
      )}
    </div>
  );
}
