"use client";

import { Payment, Project } from "@/lib/firebase/db";
import { format } from "date-fns";
import { DollarSign, Calendar, FileText } from "lucide-react";
import Link from "next/link";

interface PaymentTimelineProps {
  payments: Payment[];
  projects: Project[];
  limit?: number;
}

export default function PaymentTimeline({ payments, projects, limit = 10 }: PaymentTimelineProps) {
  const sortedPayments = [...payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getPaymentTypeLabel = (payment: Payment) => {
    if (payment.payment_type === "advance") return "Advance";
    if (payment.payment_type === "partial") return "Partial";
    if (payment.payment_type === "final") return "Final";
    return "Payment";
  };

  const getPaymentTypeColor = (payment: Payment) => {
    if (payment.payment_type === "advance") return "bg-blue-100 text-blue-800";
    if (payment.payment_type === "partial") return "bg-yellow-100 text-yellow-800";
    if (payment.payment_type === "final") return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  if (sortedPayments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No payments yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
        </div>
        <Link
          href="/payments"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          View all →
        </Link>
      </div>
      <div className="space-y-4">
        {sortedPayments.map((payment, idx) => (
          <Link
            key={payment.id}
            href={`/projects/${payment.project_id}`}
            className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {getProjectName(payment.project_id)}
                  </h3>
                  {payment.payment_type && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentTypeColor(payment)}`}
                    >
                      {getPaymentTypeLabel(payment)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold text-gray-900">
                      ₹{payment.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(payment.date), "MMM dd, yyyy")}</span>
                  </div>
                </div>
                {payment.notes && (
                  <div className="flex items-start gap-1 mt-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{payment.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

