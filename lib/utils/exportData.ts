// Utility function to export data to CSV with organized formatting
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Use provided headers or get from first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(","),
    ...data.map((row) =>
      csvHeaders
        .map((header) => {
          const value = row[header];
          // Handle null/undefined
          if (value === null || value === undefined) return "";
          // Handle dates
          if (value instanceof Date) {
            return `"${value.toLocaleDateString()}"`;
          }
          // Handle objects/arrays
          if (typeof value === "object") {
            return `"${JSON.stringify(value)}"`;
          }
          // Escape quotes and wrap in quotes if contains comma or newline
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}