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
  createdAt: Date;
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
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Project;
  }
  return null;
};

export const createProject = async (project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, "projects"), {
    ...project,
    deadline: project.deadline ? toTimestamp(project.deadline) : null,
    reminder_date: project.reminder_date ? toTimestamp(project.reminder_date) : null,
    completed_date: project.completed_date ? toTimestamp(project.completed_date) : null,
    createdAt: toTimestamp(now),
    updatedAt: toTimestamp(now),
  });
  return docRef.id;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  const docRef = doc(db, "projects", projectId);
  const updateData: any = {
    ...updates,
    updatedAt: toTimestamp(new Date()),
  };
  delete updateData.id;
  if (updateData.createdAt) delete updateData.createdAt;
  if (updateData.deadline) {
    updateData.deadline = toTimestamp(updateData.deadline);
  }
  if (updateData.reminder_date) {
    updateData.reminder_date = toTimestamp(updateData.reminder_date);
  }
  // Handle completed_date
  if (updateData.completed_date) {
    updateData.completed_date = toTimestamp(updateData.completed_date);
  } else if (updateData.status !== undefined && updateData.status !== "completed") {
    // Clear completed_date if status is being changed to something other than completed
    updateData.completed_date = null;
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
  
  const docRef = await addDoc(collection(db, "payments"), paymentData);
  return docRef.id;
};

export const deletePayment = async (paymentId: string): Promise<void> => {
  await deleteDoc(doc(db, "payments", paymentId));
};

