"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where, orderBy, limit, deleteDoc, doc } from "firebase/firestore";
import { EmailLog, EmailQueueItem } from "@/lib/email/types";
import { format } from "date-fns";
import { CheckCircle, XCircle, Mail, Clock, RefreshCw, Trash2 } from "lucide-react";

export default function EmailLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [queued, setQueued] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"all" | "queued" | "sent">("all");

  useEffect(() => {
    if (user) {
      loadData();
      // Refresh every 30 seconds to show updated queue status
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeView]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load queued emails
      const queuedQuery = query(
        collection(db, "email_queue"),
        where("userId", "==", user.uid),
        where("status", "==", "pending"),
        orderBy("sendAt", "asc"),
        limit(100)
      );
      const queuedSnapshot = await getDocs(queuedQuery);
      const queuedEmails = queuedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        sendAt: doc.data().sendAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        sentAt: doc.data().sentAt?.toDate(),
      })) as EmailQueueItem[];
      setQueued(queuedEmails);

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

  const getTimeUntilSend = (sendAt: Date) => {
    const now = new Date();
    const diff = sendAt.getTime() - now.getTime();
    if (diff <= 0) return "Ready to send (will be sent automatically)";
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (minutes > 0) {
      return `Will send in ${minutes}m ${seconds}s`;
    }
    return `Will send in ${seconds}s`;
  };

  const handleDeleteQueued = async (emailId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this queued email? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "email_queue", emailId));
      // Reload data to refresh the list
      await loadData();
    } catch (error: any) {
      console.error("Error deleting queued email:", error);
      alert(`Failed to delete email: ${error.message || "Unknown error"}`);
    }
  };

  if (loading && logs.length === 0 && queued.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const filteredQueued = activeView === "all" || activeView === "queued" ? queued : [];
  const filteredLogs = activeView === "all" || activeView === "sent" ? logs : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Email Queue & Logs</h2>
          <p className="text-xs text-gray-500 mt-0.5">View queued emails and sent email history</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        <button
          onClick={() => setActiveView("all")}
          className={`px-3 py-2 font-medium text-xs border-b-2 transition ${
            activeView === "all"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All ({queued.length + logs.length})
        </button>
        <button
          onClick={() => setActiveView("queued")}
          className={`px-3 py-2 font-medium text-xs border-b-2 transition ${
            activeView === "queued"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Queued ({queued.length})
        </button>
        <button
          onClick={() => setActiveView("sent")}
          className={`px-3 py-2 font-medium text-xs border-b-2 transition ${
            activeView === "sent"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Sent ({logs.length})
        </button>
      </div>

      {/* Queued Emails Section */}
      {filteredQueued.length > 0 && (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <h3 className="text-sm font-medium text-gray-900">Queued Emails ({queued.length})</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Emails waiting to be sent</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
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
                    Scheduled
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Retry
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredQueued.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                      {item.to}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 max-w-[150px] truncate">
                      {item.subject}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {item.templateName || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {item.event || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      <div>{format(item.sendAt, "MMM dd, yyyy HH:mm:ss")}</div>
                      <div className="text-xs text-yellow-600 mt-1">
                        {getTimeUntilSend(item.sendAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {item.retryCount || 0} / 3
                    </td>
                    <td className="px-4 py-3 text-xs text-red-500 max-w-[100px]">
                      {item.error ? (
                        <span className="truncate block" title={item.error}>
                          {item.error}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-yellow-100 text-yellow-700">
                        Queued
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteQueued(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete queued email"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sent Emails Section */}
      {filteredLogs.length > 0 && (
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
                {filteredLogs.map((log) => (
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
      {filteredQueued.length === 0 && filteredLogs.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No emails found.</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeView === "queued"
              ? "No emails are currently queued."
              : activeView === "sent"
              ? "No emails have been sent yet."
              : "Emails will appear here once automation rules are triggered."}
          </p>
        </div>
      )}
    </div>
  );
}
