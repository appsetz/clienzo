import { startOfMonth, endOfMonth, format, subMonths, eachMonthOfInterval, isSameMonth } from "date-fns";
import { Payment, Project, Client, Investment } from "@/lib/firebase/db";

export interface DateRange {
  start: Date;
  end: Date;
}

// Get date range for a specific month
export function getMonthDateRange(month: Date): DateRange {
  return {
    start: startOfMonth(month),
    end: endOfMonth(month),
  };
}

// Check if a date is within a month
export function isDateInMonth(date: Date | string, month: Date): boolean {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  return isSameMonth(parsedDate, month);
}

// Filter payments by month
export function filterPaymentsByMonth(payments: Payment[], month: Date): Payment[] {
  const { start, end } = getMonthDateRange(month);
  return payments.filter((p) => {
    const paymentDate = new Date(p.date);
    return paymentDate >= start && paymentDate <= end;
  });
}

// Filter projects by creation month
export function filterProjectsByMonth(projects: Project[], month: Date): Project[] {
  const { start, end } = getMonthDateRange(month);
  return projects.filter((p) => {
    const createdDate = new Date(p.createdAt);
    return createdDate >= start && createdDate <= end;
  });
}

// Filter clients by creation month
export function filterClientsByMonth(clients: Client[], month: Date): Client[] {
  const { start, end } = getMonthDateRange(month);
  return clients.filter((c) => {
    const createdDate = new Date(c.createdAt);
    return createdDate >= start && createdDate <= end;
  });
}

// Filter investments by month
export function filterInvestmentsByMonth(investments: Investment[], month: Date): Investment[] {
  const { start, end } = getMonthDateRange(month);
  return investments.filter((inv) => {
    const invDate = new Date(inv.date);
    return invDate >= start && invDate <= end;
  });
}

// Calculate monthly revenue
export function calculateMonthlyRevenue(payments: Payment[], month: Date): number {
  const monthPayments = filterPaymentsByMonth(payments, month);
  return monthPayments.reduce((sum, p) => sum + p.amount, 0);
}

// Get monthly chart data for a specific date range
export function getMonthlyChartData(
  payments: Payment[],
  projects: Project[],
  monthsBack: number = 11,
  endMonth: Date = new Date()
) {
  const months = eachMonthOfInterval({
    start: subMonths(endMonth, monthsBack),
    end: endMonth,
  });

  return months.map((month) => {
    const { start, end } = getMonthDateRange(month);

    const monthPayments = payments.filter((p) => {
      const paymentDate = new Date(p.date);
      return paymentDate >= start && paymentDate <= end;
    });
    const paymentsTotal = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    const monthProjects = projects.filter((p) => {
      const createdDate = new Date(p.createdAt);
      return createdDate >= start && createdDate <= end;
    });

    const completedProjects = projects.filter((p) => {
      if (p.status !== "completed" || !p.updatedAt) return false;
      const updatedDate = new Date(p.updatedAt);
      return updatedDate >= start && updatedDate <= end;
    });

    return {
      month: format(month, "MMM"),
      fullMonth: format(month, "MMM yyyy"),
      monthDate: month,
      payments: paymentsTotal,
      projectsCreated: monthProjects.length,
      projectsCompleted: completedProjects.length,
    };
  });
}

// Get project status counts for a specific month
export function getProjectStatusCountsByMonth(projects: Project[], month: Date) {
  const monthProjects = filterProjectsByMonth(projects, month);

  return {
    active: monthProjects.filter((p) => p.status === "active").length,
    completed: monthProjects.filter((p) => p.status === "completed").length,
    onHold: monthProjects.filter((p) => p.status === "on-hold").length,
    cancelled: monthProjects.filter((p) => p.status === "cancelled").length,
    total: monthProjects.length,
  };
}

// Get payment status for a specific month
export function getPaymentStatusByMonth(
  payments: Payment[],
  projects: Project[],
  month: Date
) {
  const monthPayments = filterPaymentsByMonth(payments, month);
  const paid = monthPayments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate pending from projects active in that month
  const pending = projects.reduce((sum, project) => {
    const projectPayments = payments.filter((p) => p.project_id === project.id);
    const projectPaid = projectPayments.reduce((s, p) => s + p.amount, 0);
    const pendingAmount = project.total_amount - projectPaid;
    return sum + (pendingAmount > 0 ? pendingAmount : 0);
  }, 0);

  return { paid, pending };
}

// Format date range for display
export function formatDateRange(startDate: Date, endDate: Date): string {
  return `${format(startDate, "dd MMM")} — ${format(endDate, "dd MMM yyyy")}`;
}

// Format month for display
export function formatMonth(month: Date): string {
  return format(month, "MMMM yyyy");
}

// Get client revenue stats for a month
export function getClientRevenueByMonth(
  clients: Client[],
  projects: Project[],
  payments: Payment[],
  month: Date
) {
  const { start, end } = getMonthDateRange(month);

  return clients.map((client) => {
    const clientProjects = projects.filter((p) => p.client_id === client.id);
    const clientPayments = payments.filter((p) => {
      const paymentDate = new Date(p.date);
      return (
        clientProjects.some((proj) => proj.id === p.project_id) &&
        paymentDate >= start &&
        paymentDate <= end
      );
    });
    const revenue = clientPayments.reduce((sum, p) => sum + p.amount, 0);

    return { client, revenue, projectCount: clientProjects.length };
  }).sort((a, b) => b.revenue - a.revenue);
}
