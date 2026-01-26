"use client";

import { useMemo, useState } from "react";
import { Client, Project, Payment } from "@/lib/firebase/db";
import { Users } from "lucide-react";
import { format, subMonths } from "date-fns";

interface ClientDistributionProps {
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  dateRange?: string;
}

export default function ClientDistribution({ clients, projects, payments, dateRange }: ClientDistributionProps) {
  const [hoveredClientId, setHoveredClientId] = useState<string | null>(null);
  
  // Calculate revenue per client
  const clientStats = useMemo(() => {
    const stats = clients.map((client) => {
      const clientProjects = projects.filter((p) => p.client_id === client.id);
      const clientPayments = payments.filter((p) => 
        clientProjects.some((proj) => proj.id === p.project_id)
      );
      const revenue = clientPayments.reduce((sum, p) => sum + p.amount, 0);
      const projectCount = clientProjects.length;
      
      return {
        client,
        revenue,
        projectCount,
      };
    });

    // Sort by revenue and take top clients
    return stats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [clients, projects, payments]);

  const totalRevenue = clientStats.reduce((sum, c) => sum + c.revenue, 0);
  const totalClients = clients.length;

  // Color palette for bars
  const colors = [
    { bg: "bg-teal-500", light: "bg-teal-100" },
    { bg: "bg-emerald-500", light: "bg-emerald-100" },
    { bg: "bg-cyan-500", light: "bg-cyan-100" },
    { bg: "bg-blue-500", light: "bg-blue-100" },
    { bg: "bg-indigo-500", light: "bg-indigo-100" },
    { bg: "bg-violet-500", light: "bg-violet-100" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Clients
            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">?</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">Revenue by client</p>
        </div>
        <button className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
          {dateRange || format(subMonths(new Date(), 2), "dd MMM")} — {format(new Date(), "dd MMM")}
        </button>
      </div>

      {/* Client Icon Visual */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                <span className="text-2xl font-bold text-gray-900">{totalClients}</span>
                <p className="text-xs text-gray-500">Clients</p>
              </div>
            </div>
          </div>
          {/* Floating dots */}
          <div className="absolute top-2 right-4 w-3 h-3 rounded-full bg-teal-400 animate-pulse"></div>
          <div className="absolute bottom-4 left-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-300"></div>
          <div className="absolute top-8 left-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-500"></div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="text-center mb-6">
        <p className="text-3xl font-bold text-gray-900">
          ₹{(totalRevenue / 1000).toFixed(1)}K
        </p>
        <p className="text-sm text-gray-500">Total Revenue</p>
      </div>

      {/* Client List with Progress Bars */}
      <div className="space-y-4">
        {clientStats.map((item, index) => {
          const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
          const color = colors[index % colors.length];
          const isHovered = hoveredClientId === item.client.id;
          
          return (
            <div 
              key={item.client.id} 
              className="space-y-2 p-2 rounded-lg transition-colors duration-200"
              onMouseEnter={() => item.client.id && setHoveredClientId(item.client.id)}
              onMouseLeave={() => setHoveredClientId(null)}
              style={{
                backgroundColor: isHovered ? '#f9fafb' : 'transparent'
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${color.bg}`}></div>
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                    {item.client.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-600">
                    ₹{(item.revenue / 1000).toFixed(0)}K
                  </span>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden cursor-pointer" title={`${item.client.name}: ₹${item.revenue.toLocaleString()} (${item.projectCount} projects)`}>
                <div
                  className={`${color.bg} h-2.5 rounded-full transition-all duration-300`}
                  style={{ width: `${Math.max(percentage, 3)}%` }}
                />
              </div>
              {isHovered && (
                <div className="text-xs text-gray-500 pl-0.5">
                  {item.projectCount} project{item.projectCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}

        {clientStats.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No client data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

