"use client";

import { useMemo, useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { Payment, Project } from "@/lib/firebase/db";
import { getMonthlyChartData } from "@/lib/dateUtils";

interface AreaChartProps {
  payments: Payment[];
  projects: Project[];
  title: string;
  dateRange?: string;
  selectedMonth?: Date;
  monthsToShow?: number;
}

export default function AreaChart({
  payments,
  projects,
  title,
  dateRange,
  selectedMonth = new Date(),
  monthsToShow = 11
}: AreaChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return getMonthlyChartData(payments, projects, monthsToShow, selectedMonth);
  }, [payments, projects, monthsToShow, selectedMonth]);

  const maxPayment = Math.max(...chartData.map((d) => d.payments), 1);
  const maxProjects = Math.max(...chartData.map((d) => Math.max(d.projectsCreated, d.projectsCompleted)), 1);

  // Calculate SVG path for area chart
  const createAreaPath = (data: number[], max: number, height: number, width: number): { linePath: string; areaPath: string } | null => {
    if (data.length === 0) return null;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (value / max) * height * 0.85;
      return `${x},${y}`;
    });

    const linePath = `M ${points.join(" L ")}`;
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
    
    return { linePath, areaPath };
  };

  const svgHeight = 200;
  const svgWidth = 600;
  
  const paymentPaths = createAreaPath(
    chartData.map((d) => d.payments),
    maxPayment,
    svgHeight,
    svgWidth
  );

  const projectCreatedPaths = createAreaPath(
    chartData.map((d) => d.projectsCreated * (maxPayment / maxProjects)),
    maxPayment,
    svgHeight,
    svgWidth
  );

  const projectCompletedPaths = createAreaPath(
    chartData.map((d) => d.projectsCompleted * (maxPayment / maxProjects)),
    maxPayment,
    svgHeight,
    svgWidth
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {title}
            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">?</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">Check overview of all your data</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
            {dateRange || `${format(subMonths(selectedMonth, monthsToShow), "MMM yyyy")} — ${format(selectedMonth, "MMM yyyy")}`}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-teal-400"></div>
          <span className="text-sm text-gray-600">Payments Received</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-sm text-gray-600">Projects Created</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-600">Projects Completed</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400">
          <span>₹{(maxPayment / 1000).toFixed(0)}K</span>
          <span>₹{(maxPayment * 0.75 / 1000).toFixed(0)}K</span>
          <span>₹{(maxPayment * 0.5 / 1000).toFixed(0)}K</span>
          <span>₹{(maxPayment * 0.25 / 1000).toFixed(0)}K</span>
          <span>0</span>
        </div>

        {/* SVG Chart */}
        <div className="ml-14 overflow-visible relative" style={{ minHeight: '280px' }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight + 30}`} className="w-full h-64">
            <defs>
              <linearGradient id="paymentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="projectCreatedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="projectCompletedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={svgHeight * (1 - ratio * 0.85)}
                x2={svgWidth}
                y2={svgHeight * (1 - ratio * 0.85)}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}

            {/* Area fills */}
            {paymentPaths?.areaPath && (
              <path d={paymentPaths.areaPath} fill="url(#paymentGradient)" />
            )}
            {projectCreatedPaths?.areaPath && (
              <path d={projectCreatedPaths.areaPath} fill="url(#projectCreatedGradient)" />
            )}
            {projectCompletedPaths?.areaPath && (
              <path d={projectCompletedPaths.areaPath} fill="url(#projectCompletedGradient)" />
            )}

            {/* Lines */}
            {paymentPaths?.linePath && (
              <path d={paymentPaths.linePath} fill="none" stroke="#2dd4bf" strokeWidth="2.5" />
            )}
            {projectCreatedPaths?.linePath && (
              <path d={projectCreatedPaths.linePath} fill="none" stroke="#10b981" strokeWidth="2" />
            )}
            {projectCompletedPaths?.linePath && (
              <path d={projectCompletedPaths.linePath} fill="none" stroke="#3b82f6" strokeWidth="2" />
            )}

            {/* Vertical guide line on hover */}
            {hoveredPoint !== null && (
              <line
                x1={(hoveredPoint / (chartData.length - 1)) * svgWidth}
                y1={0}
                x2={(hoveredPoint / (chartData.length - 1)) * svgWidth}
                y2={svgHeight}
                stroke="#e5e7eb"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}

            {/* Interactive Data points with hover */}
            {chartData.map((d, i) => {
              const x = (i / (chartData.length - 1)) * svgWidth;
              const yPayment = svgHeight - (d.payments / maxPayment) * svgHeight * 0.85;
              const isHovered = hoveredPoint === i;
              return (
                <g key={i}>
                  {/* Invisible larger hitbox for better hover detection */}
                  <circle
                    cx={x}
                    cy={yPayment}
                    r="25"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Hover highlight ring */}
                  {isHovered && (
                    <>
                      <circle cx={x} cy={yPayment} r="12" fill="#2dd4bf" fillOpacity="0.2" />
                      <circle cx={x} cy={yPayment} r="8" fill="#2dd4bf" fillOpacity="0.3" />
                    </>
                  )}
                  {/* Main point */}
                  <circle cx={x} cy={yPayment} r={isHovered ? 7 : 4} fill="#2dd4bf" className="transition-all duration-150" />
                  <circle cx={x} cy={yPayment} r={isHovered ? 3.5 : 2} fill="white" className="transition-all duration-150" />
                </g>
              );
            })}

            {/* X-axis labels */}
            {chartData.map((d, i) => (
              <text
                key={i}
                x={(i / (chartData.length - 1)) * svgWidth}
                y={svgHeight + 20}
                textAnchor="middle"
                className={`text-xs cursor-pointer transition-colors ${hoveredPoint === i ? 'fill-teal-600 font-medium' : 'fill-gray-400'}`}
                fontSize="11"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {d.month}
              </text>
            ))}
          </svg>

          {/* Tooltip - Positioned outside SVG */}
          {hoveredPoint !== null && chartData[hoveredPoint] && (
            <div
              className="absolute bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs z-50 pointer-events-none transform -translate-x-1/2 whitespace-nowrap"
              style={{
                left: `calc(3.5rem + (${hoveredPoint / (chartData.length - 1)} * (100% - 3.5rem)))`,
                top: '-60px',
              }}
            >
              <div className="font-semibold mb-2 text-sm">{chartData[hoveredPoint].fullMonth || chartData[hoveredPoint].month}</div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-400"></div>
                <span>₹{chartData[hoveredPoint].payments.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span>{chartData[hoveredPoint].projectsCreated} created</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span>{chartData[hoveredPoint].projectsCompleted} done</span>
              </div>
              {/* Arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

