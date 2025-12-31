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
  // All features are now available to everyone
  return {
    maxClients: Infinity,
    maxProjects: Infinity,
    hasReminders: true,
    hasAnalytics: true,
    hasExports: true,
  };
};

export const checkClientLimit = async (userId: string, plan: UserProfile["plan"]): Promise<boolean> => {
  // No limits - everyone has unlimited access
  return true;
};

export const checkProjectLimit = async (userId: string, plan: UserProfile["plan"]): Promise<boolean> => {
  // No limits - everyone has unlimited access
  return true;
};

