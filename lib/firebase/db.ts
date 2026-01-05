import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";

// Types
export interface Client {
  id?: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id?: string;
  client_id: string;
  user_id: string;
  name: string;
  status: "active" | "completed" | "on-hold" | "cancelled";
  deadline?: Date;
  total_amount: number;
  reminder_date?: Date;
  completed_date?: Date;
  team_members?: string[]; // Array of team member IDs (for agencies, max 3)
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id?: string;
  project_id: string;
  user_id: string;
  amount: number;
  date: Date;
  notes?: string;
  payment_type?: "advance" | "partial" | "final";
  payment_method?: "upi" | "cash" | "bank_account";
  upi_id?: string;
  bank_account?: string;
  createdAt: Date;
}

export interface Review {
  id?: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  features_requested?: string;
  createdAt: Date;
  approved?: boolean; // For moderation
}

// Helper to convert Firestore Timestamp to Date
const toDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

// Helper to convert Date to Firestore Timestamp
const toTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Clients
export const getClients = async (userId: string): Promise<Client[]> => {
  try {
    const q = query(
      collection(db, "clients"),
      where("user_id", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt),
    })) as Client[];
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
      throw new Error(`Firestore index required for clients collection. ${error?.message || "Please create the index."}`);
    }
    throw error;
  }
};

export const getClient = async (clientId: string): Promise<Client | null> => {
  const docRef = doc(db, "clients", clientId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: toDate(docSnap.data().createdAt),
      updatedAt: toDate(docSnap.data().updatedAt),
    } as Client;
  }
  return null;
};

export const createClient = async (client: Omit<Client, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, "clients"), {
    ...client,
    createdAt: toTimestamp(now),
    updatedAt: toTimestamp(now),
  });
  return docRef.id;
};

export const updateClient = async (clientId: string, updates: Partial<Client>): Promise<void> => {
  const docRef = doc(db, "clients", clientId);
  const updateData: any = {
    ...updates,
    updatedAt: toTimestamp(new Date()),
  };
  // Remove id from updates
  delete updateData.id;
  // Convert dates to timestamps
  if (updateData.createdAt) delete updateData.createdAt;
  await updateDoc(docRef, updateData);
};

export const deleteClient = async (clientId: string): Promise<void> => {
  await deleteDoc(doc(db, "clients", clientId));
};

// Projects
export const getProjects = async (userId: string, clientId?: string): Promise<Project[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where("user_id", "==", userId),
      orderBy("createdAt", "desc"),
    ];
    
    if (clientId) {
      constraints.unshift(where("client_id", "==", clientId));
    }
    
    const q = query(collection(db, "projects"), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        deadline: data.deadline ? toDate(data.deadline) : undefined,
        reminder_date: data.reminder_date ? toDate(data.reminder_date) : undefined,
        completed_date: data.completed_date ? toDate(data.completed_date) : undefined,
        team_members: data.team_members || undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      };
    }) as Project[];
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
      throw new Error(`Firestore index required for projects collection. ${error?.message || "Please create the index."}`);
    }
    throw error;
  }
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  const docRef = doc(db, "projects", projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      deadline: data.deadline ? toDate(data.deadline) : undefined,
      reminder_date: data.reminder_date ? toDate(data.reminder_date) : undefined,
      completed_date: data.completed_date ? toDate(data.completed_date) : undefined,
      team_members: data.team_members || undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Project;
  }
  return null;
};

export const createProject = async (project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const now = new Date();
  
  // Extract team_members separately to avoid including undefined in the spread
  const { team_members, ...projectWithoutTeam } = project;
  
  const projectData: any = {
    ...projectWithoutTeam,
    deadline: project.deadline ? toTimestamp(project.deadline) : null,
    reminder_date: project.reminder_date ? toTimestamp(project.reminder_date) : null,
    completed_date: project.completed_date ? toTimestamp(project.completed_date) : null,
    createdAt: toTimestamp(now),
    updatedAt: toTimestamp(now),
  };
  
  // Only include team_members if it's defined and not empty
  // Firestore doesn't accept undefined values, so we only add the field if it exists
  if (team_members && team_members.length > 0) {
    projectData.team_members = team_members;
  }
  // If undefined or empty, don't include it at all
  
  const docRef = await addDoc(collection(db, "projects"), projectData);
  return docRef.id;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  const docRef = doc(db, "projects", projectId);
  const updateData: any = {
    updatedAt: toTimestamp(new Date()),
  };
  
  // Only include fields that are actually being updated (not undefined)
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.client_id !== undefined) updateData.client_id = updates.client_id;
  if (updates.total_amount !== undefined) updateData.total_amount = updates.total_amount;
  
  // Handle date fields - convert to timestamp or set to null (never undefined)
  if (updates.deadline !== undefined) {
    updateData.deadline = updates.deadline ? toTimestamp(updates.deadline) : null;
  }
  if (updates.reminder_date !== undefined) {
    updateData.reminder_date = updates.reminder_date ? toTimestamp(updates.reminder_date) : null;
  }
  if (updates.completed_date !== undefined) {
    updateData.completed_date = updates.completed_date ? toTimestamp(updates.completed_date) : null;
  } else if (updates.status !== undefined && updates.status !== "completed") {
    // Clear completed_date if status is being changed to something other than completed
    updateData.completed_date = null;
  }
  
  // Handle team_members - only include if defined
  if (updates.team_members !== undefined) {
    if (updates.team_members && updates.team_members.length > 0) {
      updateData.team_members = updates.team_members;
    } else {
      updateData.team_members = null;
    }
  }
  
  await updateDoc(docRef, updateData);
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await deleteDoc(doc(db, "projects", projectId));
};

// Payments
export const getPayments = async (userId: string, projectId?: string): Promise<Payment[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where("user_id", "==", userId),
      orderBy("date", "desc"),
    ];
    
    if (projectId) {
      constraints.unshift(where("project_id", "==", projectId));
    }
    
    const q = query(collection(db, "payments"), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: toDate(data.date),
        createdAt: toDate(data.createdAt),
      };
    }) as Payment[];
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
      throw new Error(`Firestore index required for payments collection. ${error?.message || "Please create the index."}`);
    }
    throw error;
  }
};

export const createPayment = async (payment: Omit<Payment, "id" | "createdAt">): Promise<string> => {
  // Filter out undefined values - Firestore doesn't accept undefined
  const paymentData: any = {
    user_id: payment.user_id,
    project_id: payment.project_id,
    amount: payment.amount,
    date: toTimestamp(payment.date),
    createdAt: toTimestamp(new Date()),
  };
  
  // Only add optional fields if they have values
  if (payment.notes) {
    paymentData.notes = payment.notes;
  }
  if (payment.payment_type) {
    paymentData.payment_type = payment.payment_type;
  }
  if (payment.payment_method) {
    paymentData.payment_method = payment.payment_method;
  }
  if (payment.upi_id) {
    paymentData.upi_id = payment.upi_id;
  }
  if (payment.bank_account) {
    paymentData.bank_account = payment.bank_account;
  }
  
  const docRef = await addDoc(collection(db, "payments"), paymentData);
  return docRef.id;
};

export const deletePayment = async (paymentId: string): Promise<void> => {
  await deleteDoc(doc(db, "payments", paymentId));
};

// Reviews
export const createReview = async (review: Omit<Review, "id" | "createdAt">): Promise<string> => {
  try {
    const reviewData: any = {
      user_id: review.user_id,
      user_name: review.user_name,
      rating: review.rating,
      comment: review.comment,
      createdAt: toTimestamp(new Date()),
      approved: true, // Auto-approve for now
    };
    
    // Only add optional fields if they exist
    if (review.features_requested) {
      reviewData.features_requested = review.features_requested;
    }
    
    const docRef = await addDoc(collection(db, "reviews"), reviewData);
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating review:", error);
    if (error?.code === "permission-denied") {
      throw new Error("Permission denied. Please check Firestore security rules.");
    }
    throw error;
  }
};

export const getReviews = async (limit: number = 50): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, "reviews"),
      where("approved", "==", true),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
      } as Review;
    });
  } catch (error: any) {
    if (error?.code === "failed-precondition") {
      throw new Error("Firestore index required for reviews query. Please create an index on 'approved' and 'createdAt'.");
    }
    throw error;
  }
};

// Team Members (for Agencies)
export interface TeamMember {
  id?: string;
  agency_id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export const getTeamMembers = async (agencyId: string): Promise<TeamMember[]> => {
  try {
    const q = query(
      collection(db, "team_members"),
      where("agency_id", "==", agencyId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as TeamMember;
    });
  } catch (error: any) {
    // Index is deployed but may still be building
    if (error?.code === "failed-precondition") {
      throw new Error("Index is building. Please wait a few minutes and refresh the page.");
    }
    throw error;
  }
};

export const createTeamMember = async (member: Omit<TeamMember, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const memberData = {
    ...member,
    createdAt: toTimestamp(new Date()),
    updatedAt: toTimestamp(new Date()),
  };
  const docRef = await addDoc(collection(db, "team_members"), memberData);
  return docRef.id;
};

export const updateTeamMember = async (memberId: string, updates: Partial<TeamMember>): Promise<void> => {
  const docRef = doc(db, "team_members", memberId);
  const updateData: any = {
    ...updates,
    updatedAt: toTimestamp(new Date()),
  };
  delete updateData.id;
  delete updateData.createdAt;
  await updateDoc(docRef, updateData);
};

export const deleteTeamMember = async (memberId: string): Promise<void> => {
  await deleteDoc(doc(db, "team_members", memberId));
};

// Team Member Payments
export interface TeamMemberPayment {
  id?: string;
  agency_id: string;
  team_member_id: string;
  amount: number;
  date: Date;
  notes?: string;
  project_id?: string; // Optional: link to a project if payment is project-related
  payment_method?: "upi" | "cash" | "bank_account" | "card";
  upi_id?: string;
  bank_account?: string;
  transaction_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const getTeamMemberPayments = async (agencyId: string, memberId?: string): Promise<TeamMemberPayment[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where("agency_id", "==", agencyId),
      orderBy("date", "desc"),
    ];
    
    if (memberId) {
      constraints.unshift(where("team_member_id", "==", memberId));
    }
    
    const q = query(collection(db, "team_member_payments"), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: toDate(data.date),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      };
    }) as TeamMemberPayment[];
  } catch (error: any) {
    console.error("Error fetching team member payments:", error);
    if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
      throw new Error(`Firestore index required for team_member_payments collection. ${error?.message || "Please create the index."}`);
    }
    throw error;
  }
};

export const createTeamMemberPayment = async (payment: Omit<TeamMemberPayment, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const now = new Date();
    const paymentData: any = {
      agency_id: payment.agency_id,
      team_member_id: payment.team_member_id,
      amount: payment.amount,
      date: toTimestamp(payment.date),
      createdAt: toTimestamp(now),
      updatedAt: toTimestamp(now),
    };
    
    // Only include optional fields if they exist and are not empty
    if (payment.notes && payment.notes.trim()) {
      paymentData.notes = payment.notes.trim();
    }
    if (payment.project_id && payment.project_id.trim()) {
      paymentData.project_id = payment.project_id.trim();
    }
    
    console.log("Creating team member payment with data:", paymentData);
    const docRef = await addDoc(collection(db, "team_member_payments"), paymentData);
    console.log("Team member payment created successfully with ID:", docRef.id);
    
    // Verify the document was created by reading it back
    const createdDoc = await getDoc(docRef);
    if (createdDoc.exists()) {
      console.log("Payment verified in Firestore:", createdDoc.data());
    } else {
      console.error("WARNING: Payment document was not found after creation!");
    }
    
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating team member payment:", error);
    console.error("Payment data that failed:", payment);
    throw error;
  }
};

export const updateTeamMemberPayment = async (paymentId: string, updates: Partial<TeamMemberPayment>): Promise<void> => {
  const docRef = doc(db, "team_member_payments", paymentId);
  const updateData: any = {
    updatedAt: toTimestamp(new Date()),
  };
  
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.date !== undefined) updateData.date = toTimestamp(updates.date);
  if (updates.notes !== undefined) updateData.notes = updates.notes || null;
  if (updates.project_id !== undefined) updateData.project_id = updates.project_id || null;
  if (updates.payment_method !== undefined) updateData.payment_method = updates.payment_method || null;
  if (updates.upi_id !== undefined) updateData.upi_id = updates.upi_id || null;
  if (updates.bank_account !== undefined) updateData.bank_account = updates.bank_account || null;
  
  await updateDoc(docRef, updateData);
};

export const deleteTeamMemberPayment = async (paymentId: string): Promise<void> => {
  await deleteDoc(doc(db, "team_member_payments", paymentId));
};

// Investments (Agency only)
export interface Investment {
  id?: string;
  agency_id: string;
  name: string;
  amount: number;
  date: Date;
  payment_method: "upi" | "cash" | "card";
  upi_id?: string;
  transaction_id?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const getInvestments = async (agencyId: string): Promise<Investment[]> => {
  try {
    const q = query(
      collection(db, "investments"),
      where("agency_id", "==", agencyId),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: toDate(data.date),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      };
    }) as Investment[];
  } catch (error: any) {
    console.error("Error fetching investments:", error);
    if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
      throw new Error(`Firestore index required for investments collection. ${error?.message || "Please create the index."}`);
    }
    throw error;
  }
};

export const createInvestment = async (investment: Omit<Investment, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const now = new Date();
    const investmentData: any = {
      agency_id: investment.agency_id,
      name: investment.name,
      amount: investment.amount,
      date: toTimestamp(investment.date),
      payment_method: investment.payment_method,
      createdAt: toTimestamp(now),
      updatedAt: toTimestamp(now),
    };
    
    // Only include optional fields if they have values
    if (investment.upi_id) {
      investmentData.upi_id = investment.upi_id;
    }
    if (investment.transaction_id) {
      investmentData.transaction_id = investment.transaction_id;
    }
    if (investment.notes) {
      investmentData.notes = investment.notes;
    }
    
    const docRef = await addDoc(collection(db, "investments"), investmentData);
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating investment:", error);
    throw error;
  }
};

export const updateInvestment = async (investmentId: string, updates: Partial<Investment>): Promise<void> => {
  try {
    const updateData: any = {
      updatedAt: toTimestamp(new Date()),
    };
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.date !== undefined) updateData.date = toTimestamp(updates.date);
    if (updates.payment_method !== undefined) updateData.payment_method = updates.payment_method;
    if (updates.upi_id !== undefined) updateData.upi_id = updates.upi_id || null;
    if (updates.transaction_id !== undefined) updateData.transaction_id = updates.transaction_id || null;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;
    
    await updateDoc(doc(db, "investments", investmentId), updateData);
  } catch (error: any) {
    console.error("Error updating investment:", error);
    throw error;
  }
};

export const deleteInvestment = async (investmentId: string): Promise<void> => {
  await deleteDoc(doc(db, "investments", investmentId));
};

