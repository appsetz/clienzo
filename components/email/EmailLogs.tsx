"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { EmailLog } from "@/lib/email/types";
import { format } from "date-fns";
import { CheckCircle, XCircle, Mail, RefreshCw } from "lucide-react";

export default function EmailLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
      // Refresh every 30 seconds to show updated logs
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load sent/failed emails
      const logsQuery = query(
        collection(db, "email_logs"),
        where("userId", "==", user.uid),
        orderBy("sentAt", "desc"),
        limit(100)
      );
      const logsSnapshot = await getDocs(logsQuery);
      const logsData = logsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate() || new Date(),
      })) as EmailLog[];
      setLogs(logsData);
    } catch (error) {
      console.error("Error loading email data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Email Logs</h2>
          <p className="text-xs text-gray-500 mt-0.5">View sent email history</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Sent Emails Section */}
      {logs.length > 0 && (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-medium text-gray-900">Sent Emails ({logs.length})</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Email delivery history</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.status === "sent" ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-100 text-green-700">
                            Sent
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">
                            Failed
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                      {log.to}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 max-w-[150px] truncate">
                      {log.subject}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {log.templateName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {log.event}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {format(log.sentAt, "MMM dd, yyyy HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {logs.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No emails found.</p>
          <p className="text-xs text-gray-400 mt-1">
            No emails have been sent yet. Emails will appear here once they are sent.
          </p>
        </div>
      )}
    </div>
  );
}
