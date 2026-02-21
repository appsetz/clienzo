"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    getLeads,
    createLead,
    updateLead,
    deleteLead,
    bulkCreateLeads,
    Lead,
} from "@/lib/firebase/db";
import {
    Plus,
    Edit2,
    Trash2,
    Mail,
    Phone,
    Search,
    Upload,
    Target,
    Building2,
    X,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Filter,
    ChevronDown,
} from "lucide-react";
import * as XLSX from "xlsx";

const STATUS_OPTIONS: { value: Lead["status"]; label: string; color: string }[] = [
    { value: "new", label: "New", color: "bg-blue-100 text-blue-700" },
    { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-700" },
    { value: "qualified", label: "Qualified", color: "bg-purple-100 text-purple-700" },
    { value: "converted", label: "Converted", color: "bg-green-100 text-green-700" },
    { value: "lost", label: "Lost", color: "bg-red-100 text-red-700" },
];

const SOURCE_OPTIONS = ["Website", "Referral", "Social Media", "Cold Call", "Email", "Event", "Other"];

const getStatusStyle = (status: Lead["status"]) =>
    STATUS_OPTIONS.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-700";

const getStatusLabel = (status: Lead["status"]) =>
    STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;

const EMPTY_FORM = {
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    status: "new" as Lead["status"],
    notes: "",
};

export default function LeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    // Add / Edit modal
    const [showModal, setShowModal] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Import modal
    const [showImport, setShowImport] = useState(false);
    const [importRows, setImportRows] = useState<any[]>([]);
    const [importFileName, setImportFileName] = useState("");
    const [importing, setImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState("");
    const [importError, setImportError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadLeads = useCallback(async () => {
        if (!user) return;
        try {
            const data = await getLeads(user.uid);
            setLeads(data);
        } catch (err) {
            console.error("Error loading leads:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) loadLeads();
    }, [user, loadLeads]);

    // ── Add / Edit ────────────────────────────────────────────────────
    const openAdd = () => {
        setEditingLead(null);
        setFormData({ ...EMPTY_FORM });
        setFormError("");
        setShowModal(true);
    };

    const openEdit = (lead: Lead) => {
        setEditingLead(lead);
        setFormData({
            name: lead.name,
            email: lead.email ?? "",
            phone: lead.phone ?? "",
            company: lead.company ?? "",
            source: lead.source ?? "",
            status: lead.status,
            notes: lead.notes ?? "",
        });
        setFormError("");
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || submitting) return;
        setFormError("");
        setSubmitting(true);
        try {
            if (editingLead) {
                await updateLead(editingLead.id!, {
                    name: formData.name,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    company: formData.company || undefined,
                    source: formData.source || undefined,
                    status: formData.status,
                    notes: formData.notes || undefined,
                });
            } else {
                await createLead({
                    user_id: user.uid,
                    name: formData.name,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    company: formData.company || undefined,
                    source: formData.source || undefined,
                    status: formData.status,
                    notes: formData.notes || undefined,
                });
            }
            setShowModal(false);
            loadLeads();
        } catch (err: any) {
            setFormError(err.message || "Failed to save lead");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (leadId: string) => {
        if (!confirm("Are you sure you want to delete this lead?")) return;
        try {
            await deleteLead(leadId);
            loadLeads();
        } catch (err) {
            console.error("Error deleting lead:", err);
        }
    };

    // ── Excel Import ──────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportError("");
        setImportSuccess("");
        setImportFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                if (rows.length === 0) {
                    setImportError("The file appears to be empty.");
                    return;
                }
                const normalised = rows.map((row) => {
                    const obj: any = {};
                    Object.keys(row).forEach((k) => { obj[k.toLowerCase().trim()] = row[k]; });
                    return obj;
                });
                setImportRows(normalised);
            } catch {
                setImportError("Could not parse the file. Please upload a valid .xlsx, .xls or .csv file.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        if (!user || importing || importRows.length === 0) return;
        setImporting(true);
        setImportError("");
        try {
            const toImport = importRows
                .filter((row) => row.name?.toString().trim())
                .map((row) => ({
                    user_id: user.uid,
                    name: row.name?.toString().trim(),
                    email: row.email?.toString().trim() || undefined,
                    phone: row.phone?.toString().trim() || undefined,
                    company: row.company?.toString().trim() || undefined,
                    source: row.source?.toString().trim() || undefined,
                    status: (["new", "contacted", "qualified", "converted", "lost"].includes(
                        row.status?.toString().toLowerCase()
                    ) ? row.status?.toString().toLowerCase() : "new") as Lead["status"],
                    notes: row.notes?.toString().trim() || undefined,
                }));
            if (toImport.length === 0) {
                setImportError("No valid leads found. Make sure the file has a 'name' column.");
                return;
            }
            await bulkCreateLeads(toImport);
            setImportSuccess(`✓ ${toImport.length} lead${toImport.length !== 1 ? "s" : ""} imported!`);
            setImportRows([]);
            setImportFileName("");
            if (fileInputRef.current) fileInputRef.current.value = "";
            loadLeads();
        } catch (err: any) {
            setImportError(err.message || "Import failed. Please try again.");
        } finally {
            setImporting(false);
        }
    };

    const closeImport = () => {
        setShowImport(false);
        setImportRows([]);
        setImportFileName("");
        setImportError("");
        setImportSuccess("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ── Derived data ─────────────────────────────────────────────────
    const filtered = leads.filter((l) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            l.name.toLowerCase().includes(q) ||
            l.email?.toLowerCase().includes(q) ||
            l.company?.toLowerCase().includes(q) ||
            l.phone?.includes(q);
        const matchesStatus = statusFilter === "all" || l.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: leads.length,
        new: leads.filter((l) => l.status === "new").length,
        contacted: leads.filter((l) => l.status === "contacted").length,
        converted: leads.filter((l) => l.status === "converted").length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
                {/* Title row */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="text-lg md:text-xl font-semibold text-gray-900">Leads</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                            Track and manage your potential clients
                        </p>
                    </div>
                    {/* Mobile: icon buttons only */}
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            onClick={() => setShowImport(true)}
                            className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                            title="Import Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button
                            onClick={openAdd}
                            className="p-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition"
                            title="Add Lead"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Search + filters row */}
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900"
                        />
                    </div>

                    {/* Mobile filter dropdown */}
                    <div className="relative md:hidden">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm transition ${statusFilter !== "all"
                                    ? "border-teal-400 bg-teal-50 text-teal-700"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showFilterMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[140px]">
                                {[{ value: "all", label: "All Status" }, ...STATUS_OPTIONS].map((s) => (
                                    <button
                                        key={s.value}
                                        onClick={() => { setStatusFilter(s.value); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl ${statusFilter === s.value ? "text-teal-600 font-medium" : "text-gray-700"
                                            }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop: filter select + full buttons */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="hidden md:block px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition"
                    >
                        <option value="all">All Status</option>
                        {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>

                    <button
                        onClick={() => setShowImport(true)}
                        className="hidden md:flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Import Excel
                    </button>

                    <button
                        onClick={openAdd}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Add Lead
                    </button>
                </div>
            </div>

            {/* ── Stats ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: "Total", value: stats.total, icon: Target, bg: "bg-teal-50", ic: "text-teal-600" },
                    { label: "New", value: stats.new, icon: Plus, bg: "bg-blue-50", ic: "text-blue-600" },
                    { label: "Contacted", value: stats.contacted, icon: Mail, bg: "bg-yellow-50", ic: "text-yellow-600" },
                    { label: "Converted", value: stats.converted, icon: CheckCircle2, bg: "bg-green-50", ic: "text-green-600" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 md:w-11 md:h-11 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.ic}`} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                                <p className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Content: cards on mobile / table on desktop ───────────── */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10 text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-7 h-7 md:w-8 md:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                        {searchQuery || statusFilter !== "all" ? "No leads found" : "No leads yet"}
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                        {searchQuery || statusFilter !== "all"
                            ? "Try adjusting your search or filter"
                            : "Add leads manually or import from Excel"}
                    </p>
                    {!searchQuery && statusFilter === "all" && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => setShowImport(true)}
                                className="w-full sm:w-auto px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                            >
                                Import Excel
                            </button>
                            <button
                                onClick={openAdd}
                                className="w-full sm:w-auto px-5 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
                            >
                                Add First Lead
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* ── Mobile: Card List ─────────────────────────── */}
                    <div className="md:hidden space-y-3">
                        {filtered.map((lead) => (
                            <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    {/* Avatar + Name */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                            {lead.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                                            {lead.company && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                    <p className="text-xs text-gray-500 truncate">{lead.company}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Status badge */}
                                    <span className={`flex-shrink-0 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(lead.status)}`}>
                                        {getStatusLabel(lead.status)}
                                    </span>
                                </div>

                                {/* Contact info */}
                                {(lead.email || lead.phone) && (
                                    <div className="mt-3 flex flex-wrap gap-3">
                                        {lead.email && (
                                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-teal-600 transition">
                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="truncate max-w-[160px]">{lead.email}</span>
                                            </a>
                                        )}
                                        {lead.phone && (
                                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-teal-600 transition">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                {lead.phone}
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Footer: source + actions */}
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs text-gray-400">{lead.source || ""}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(lead)}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(lead.id!)}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-medium text-red-600 transition"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Notes */}
                                {lead.notes && (
                                    <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 line-clamp-2">
                                        {lead.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Desktop: Table ────────────────────────────── */}
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Lead</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Contact</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Company</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Source</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((lead) => (
                                        <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                                        {lead.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                                                        {lead.notes && (
                                                            <p className="text-[10px] text-gray-500 truncate max-w-[140px]">{lead.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="space-y-0.5">
                                                    {lead.email && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                            <Mail className="w-3 h-3 text-gray-400" />{lead.email}
                                                        </div>
                                                    )}
                                                    {lead.phone && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                            <Phone className="w-3 h-3 text-gray-400" />{lead.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {lead.company ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <Building2 className="w-3 h-3 text-gray-400" />{lead.company}
                                                    </div>
                                                ) : <span className="text-xs text-gray-400">—</span>}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-xs text-gray-600">{lead.source || "—"}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(lead.status)}`}>
                                                    {getStatusLabel(lead.status)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openEdit(lead)} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition" title="Edit">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(lead.id!)} className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition" title="Delete">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── Add / Edit Modal ─────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50">
                    {/* Mobile: slides up from bottom; Desktop: centered */}
                    <div className="bg-white w-full md:max-w-md md:w-full md:mx-4 rounded-t-3xl md:rounded-2xl max-h-[92vh] overflow-y-auto shadow-xl">
                        {/* Mobile drag indicator */}
                        <div className="md:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-200 rounded-full" />
                        </div>

                        <div className="px-5 pb-5 pt-2 md:p-5">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {editingLead ? "Edit Lead" : "Add New Lead"}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Enter lead name"
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="email@example.com"
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+91 XXXXX"
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                                        <input
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            placeholder="Company name"
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
                                        <select
                                            value={formData.source}
                                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm bg-white"
                                        >
                                            <option value="">Select</option>
                                            {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {STATUS_OPTIONS.map((s) => (
                                            <button
                                                key={s.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status: s.value })}
                                                className={`px-2 py-2 rounded-xl text-xs font-medium border transition ${formData.status === s.value
                                                        ? `${s.color} border-current`
                                                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={2}
                                        placeholder="Additional notes..."
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition text-gray-900 text-sm resize-none"
                                    />
                                </div>

                                {formError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
                                        {formError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50"
                                    >
                                        {submitting ? (editingLead ? "Updating..." : "Adding...") : (editingLead ? "Update" : "Add Lead")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Import Modal ──────────────────────────────────────────── */}
            {showImport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50">
                    <div className="bg-white w-full md:max-w-xl md:w-full md:mx-4 rounded-t-3xl md:rounded-2xl max-h-[92vh] overflow-y-auto shadow-xl">
                        {/* Mobile drag indicator */}
                        <div className="md:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-200 rounded-full" />
                        </div>

                        <div className="px-5 pb-5 pt-2 md:p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Import from Excel</h2>
                                </div>
                                <button onClick={closeImport} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                                <p className="text-xs font-medium text-blue-700 mb-1">Supported columns:</p>
                                <p className="text-xs text-blue-600 font-mono">name*, email, phone, company, source, status, notes</p>
                                <p className="text-xs text-blue-500 mt-1">* Required  •  Accepts .xlsx .xls .csv</p>
                            </div>

                            {/* File picker */}
                            <div
                                className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-700">
                                    {importFileName || "Tap to upload file"}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv</p>
                                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                            </div>

                            {/* Error / Success */}
                            {importError && (
                                <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{importError}
                                </div>
                            )}
                            {importSuccess && (
                                <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-xl text-sm">
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{importSuccess}
                                </div>
                            )}

                            {/* Preview */}
                            {importRows.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-medium text-gray-500 mb-2">
                                        Preview — {importRows.length} row{importRows.length !== 1 ? "s" : ""} detected
                                        {importRows.length > 5 ? " (showing first 5)" : ""}
                                    </p>
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                    {Object.keys(importRows[0]).slice(0, 5).map((k) => (
                                                        <th key={k} className="text-left px-3 py-2 font-medium text-gray-500 capitalize whitespace-nowrap">{k}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importRows.slice(0, 5).map((row, i) => (
                                                    <tr key={i} className="border-b border-gray-50 last:border-0">
                                                        {Object.keys(importRows[0]).slice(0, 5).map((k) => (
                                                            <td key={k} className="px-3 py-2 text-gray-700 max-w-[100px] truncate">
                                                                {row[k]?.toString() || "—"}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={closeImport}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importing || importRows.length === 0}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {importing ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Importing...</>
                                    ) : (
                                        <><Upload className="w-4 h-4" />Import {importRows.length > 0 ? `${importRows.length} Leads` : ""}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
