/**
 * Utility functions to handle Firestore offline errors gracefully
 */

export const isOfflineError = (error: any): boolean => {
  return (
    error?.code === "unavailable" ||
    error?.message?.includes("offline") ||
    error?.message?.includes("Failed to get document because the client is offline")
  );
};

export const handleFirestoreError = (error: any, defaultMessage: string = "An error occurred"): string => {
  if (isOfflineError(error)) {
    return "You're currently offline. Please check your internet connection.";
  }
  
  if (error?.code === "permission-denied") {
    return "You don't have permission to perform this action.";
  }
  
  if (error?.code === "not-found") {
    return "The requested item was not found.";
  }
  
  return error?.message || defaultMessage;
};

