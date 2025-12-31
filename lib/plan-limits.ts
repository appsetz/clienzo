import { UserProfile } from "./firebase/auth";
import { getClients, getProjects } from "./firebase/db";

export interface PlanLimits {
  maxClients: number;
  maxProjects: number;
  hasReminders: boolean;
  hasAnalytics: boolean;
  hasExports: boolean;
}

export const getPlanLimits = (plan: UserProfile["plan"]): PlanLimits => {
  switch (plan) {
    case "free":
      return {
        maxClients: 3,
        maxProjects: 3,
        hasReminders: false,
        hasAnalytics: false,
        hasExports: false,
      };
    case "pro":
      return {
        maxClients: Infinity,
        maxProjects: Infinity,
        hasReminders: true,
        hasAnalytics: true,
        hasExports: true,
      };
    case "agency":
      return {
        maxClients: Infinity,
        maxProjects: Infinity,
        hasReminders: true,
        hasAnalytics: true,
        hasExports: true,
      };
    default:
      return getPlanLimits("free");
  }
};

export const checkClientLimit = async (userId: string, plan: UserProfile["plan"]): Promise<boolean> => {
  const limits = getPlanLimits(plan);
  if (limits.maxClients === Infinity) return true;
  
  const clients = await getClients(userId);
  return clients.length < limits.maxClients;
};

export const checkProjectLimit = async (userId: string, plan: UserProfile["plan"]): Promise<boolean> => {
  const limits = getPlanLimits(plan);
  if (limits.maxProjects === Infinity) return true;
  
  const projects = await getProjects(userId);
  const activeProjects = projects.filter((p) => p.status === "active");
  return activeProjects.length < limits.maxProjects;
};

