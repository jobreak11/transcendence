"use client";

import React, { useState, useEffect, useCallback } from "react";

// ==========================================
// OpenAPI TypeScript Definitions (Title)
// ==========================================

export interface TitleDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface GetUserTitleDto {
  name: string;
  description: string | null;
  titleId: string;
  unlockedAt: string;
}

export interface CreateNewTitleZodDto {
  name: string;
  description?: string | null;
  createdAt?: string;
}

export interface UpdateTitleZodDto {
  name: string;
  description?: string | null;
  createdAt?: string;
}

export interface UserTitleDto {
  userId: string;
  titleId: string;
  unlockedAt: string;
}

// ==========================================
// Main Component
// ==========================================

export default function SysAdminTitleManagementPage() {
  // Data State
  const [titles, setTitles] = useState<TitleDto[]>([]);
  const [myTitles, setMyTitles] = useState<GetUserTitleDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Client-side Pagination State (for consistent UI with User Management)
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);

  // Lookup State (/title/find supports mutually exclusive `titleId` OR `titleName`)
  const [lookupMode, setLookupMode] = useState<"titleId" | "titleName">("titleName");
  const [lookupQuery, setLookupQuery] = useState<string>("");
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);

  // Modals & Drawers State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [titleToEdit, setTitleToEdit] = useState<TitleDto | null>(null);
  const [titleToDelete, setTitleToDelete] = useState<TitleDto | null>(null);
  const [inspectedTitle, setInspectedTitle] = useState<TitleDto | null>(null);
  const [assignModal, setAssignModal] = useState<{
    mode: "give" | "revoke";
    title?: TitleDto;
  } | null>(null);

  // Forms State
  const [createForm, setCreateForm] = useState<CreateNewTitleZodDto>({
    name: "",
    description: "",
  });

  const [editForm, setEditForm] = useState<UpdateTitleZodDto>({
    name: "",
    description: "",
  });

  const [assignForm, setAssignForm] = useState<{
    userId: string;
    titleId: string;
  }>({
    userId: "",
    titleId: "",
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  // Notification Toast State
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    return headers;
  }, []);

  // ==========================================
  // API Handlers
  // ==========================================

  // 1. Fetch All Titles (GET /title/all) & Current Admin's Unlocked Titles (GET /title)
  const fetchTitles = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, myRes] = await Promise.all([
        fetch(`/api/title/all`, {
          method: "GET",
          headers: getHeaders(),
        }),
        fetch(`/api/title`, {
          method: "GET",
          headers: getHeaders(),
        }),
      ]);

      if (!allRes.ok) {
        throw new Error(`Failed to fetch titles (HTTP ${allRes.status})`);
      }

      const allData: TitleDto[] = await allRes.json();
      setTitles(allData);

      if (myRes.ok) {
        const myData: GetUserTitleDto[] = await myRes.json();
        setMyTitles(myData);
      }
    } catch (err: any) {
      showToast("error", err.message || "Error connecting to backend service.");
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchTitles();
  }, [fetchTitles]);

  // 2. Lookup Single Title (GET /title/find?titleId=... OR ?titleName=...)
  const handleTitleLookup = async (
    e?: React.FormEvent,
    overrideMode?: "titleId" | "titleName",
    overrideValue?: string
  ) => {
    if (e) e.preventDefault();

    const mode = overrideMode || lookupMode;
    const query = (overrideValue ?? lookupQuery).trim();

    if (!query) {
      showToast(
        "error",
        `Please enter a ${mode === "titleId" ? "Title ID" : "Title Name"}`
      );
      return;
    }

    setLookupLoading(true);
    try {
      // Strictly send ONLY `titleId` OR `titleName` (never both, avoiding 403 error)
      const param = new URLSearchParams({ [mode]: query });
      const res = await fetch(`/api/title/find?${param.toString()}`, {
        method: "GET",
      });

      if (res.status === 403) {
        throw new Error(
          "Forbidden (403): titleId and titleName query cannot go together."
        );
      }
      if (!res.ok) {
        throw new Error(`Title lookup failed (HTTP ${res.status})`);
      }

      const titleData: TitleDto = await res.json();
      setInspectedTitle(titleData);
    } catch (err: any) {
      showToast("error", err.message || "Failed to lookup title details.");
    } finally {
      setLookupLoading(false);
    }
  };

  // 3. Create New Title (POST /title/new)
  const handleCreateTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      showToast("error", "Title name is required.");
      return;
    }

    setSubmitting(true);
    const payload: CreateNewTitleZodDto = {
      name: createForm.name.trim(),
      description: createForm.description?.trim() || null,
    };

    try {
      const res = await fetch(`/api/title/new`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to create title (HTTP ${res.status})`);
      }

      showToast("success", "New title created successfully.");
      setIsCreateModalOpen(false);
      setCreateForm({ name: "", description: "" });
      fetchTitles();
    } catch (err: any) {
      showToast("error", err.message || "Error creating title.");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Update Title (PATCH /title/update?titleId=...)
  const handleUpdateTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleToEdit) return;
    if (!editForm.name.trim()) {
      showToast("error", "Title name is required.");
      return;
    }

    setSubmitting(true);
    const payload: UpdateTitleZodDto = {
      name: editForm.name.trim(),
      description: editForm.description?.trim() || null,
    };

    try {
      const params = new URLSearchParams({ titleId: titleToEdit.id });
      const res = await fetch(`/api/title/update?${params.toString()}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to update title (HTTP ${res.status})`);
      }

      showToast("success", `Title "${payload.name}" updated.`);
      setTitleToEdit(null);
      fetchTitles();
    } catch (err: any) {
      showToast("error", err.message || "Could not update title.");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Delete Title (DELETE /title/delete?titleId=...)
  const handleDeleteTitle = async () => {
    if (!titleToDelete) return;
    setSubmitting(true);

    try {
      const params = new URLSearchParams({ titleId: titleToDelete.id });
      const res = await fetch(`/api/title/delete?${params.toString()}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Delete failed (HTTP ${res.status})`);
      }

      showToast("success", "Title permanently deleted.");
      if (inspectedTitle?.id === titleToDelete.id) {
        setInspectedTitle(null);
      }
      setTitleToDelete(null);
      fetchTitles();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete title.");
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Give or Revoke User Title (POST /title/give OR DELETE /title/revoke)
  const handleAssignUserTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal) return;

    const userId = assignForm.userId.trim();
    const titleId = assignForm.titleId.trim();

    if (!userId || !titleId) {
      showToast("error", "Both User ID and Title ID are required.");
      return;
    }

    setSubmitting(true);
    try {
      const params = new URLSearchParams({ userId, titleId });
      const isGive = assignModal.mode === "give";
      const endpoint = isGive ? "/api/title/give" : "/api/title/revoke";

      const res = await fetch(`${endpoint}?${params.toString()}`, {
        method: isGive ? "POST" : "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(
          `Failed to ${assignModal.mode} title (HTTP ${res.status})`
        );
      }

      if (isGive) {
        const result: UserTitleDto = await res.json();
        showToast(
          "success",
          `Granted title (${result.titleId}) to user ${result.userId}.`
        );
      } else {
        showToast("success", `Revoked title (${titleId}) from user ${userId}.`);
      }

      setAssignModal(null);
      setAssignForm({ userId: "", titleId: "" });
      fetchTitles();
    } catch (err: any) {
      showToast("error", err.message || `Failed to ${assignModal.mode} title.`);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // UI Helpers & Filtering
  // ==========================================

  const openEditModal = (title: TitleDto) => {
    setTitleToEdit(title);
    setEditForm({
      name: title.name,
      description: title.description || "",
    });
  };

  const openAssignModal = (mode: "give" | "revoke", title?: TitleDto) => {
    setAssignModal({ mode, title });
    setAssignForm({
      userId: "",
      titleId: title ? title.id : titles[0]?.id || "",
    });
  };

  const filteredTitles = titles.filter(
    (t) =>
      t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (t.description &&
        t.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const paginatedTitles = filteredTitles.slice(offset, offset + limit);
  const totalCount = filteredTitles.length;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const isUnlockedByMe = (titleId: string) =>
    myTitles.some((mt) => mt.titleId === titleId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl bg-slate-900 border-slate-700">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              toast.type === "success" ? "bg-emerald-400" : "bg-rose-500"
            }`}
          />
          <p className="text-sm font-medium text-slate-200">{toast.message}</p>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-200 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              SysAdmin Title Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openAssignModal("give")}
              className="px-3.5 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition"
            >
              ★ Give Title
            </button>
            <button
              onClick={() => openAssignModal("revoke")}
              className="px-3.5 py-2 rounded-lg text-sm font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
            >
              Revoke Title
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <span>+</span> Create Title
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metrics & Quick Lookup Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Metric Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Titles
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">
                  {titles.length}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  /title/all
                </span>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                My Unlocked Titles
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-400">
                  {myTitles.length}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  GET /title
                </span>
              </div>
            </div>
          </div>

          {/* Exact Title Lookup Bar (GET /title/find) */}
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Title Lookup (GET /title/find)
              </span>
              <span className="text-[11px] text-slate-500">
                Mutually exclusive query params
              </span>
            </div>
            <form
              onSubmit={handleTitleLookup}
              className="flex flex-col sm:flex-row gap-2"
            >
              <select
                value={lookupMode}
                onChange={(e) =>
                  setLookupMode(e.target.value as "titleId" | "titleName")
                }
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="titleName">By Name (?titleName=)</option>
                <option value="titleId">By Title ID (?titleId=)</option>
              </select>
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder={
                  lookupMode === "titleName"
                    ? "Enter title name (e.g. all in one)"
                    : "Enter title ID (e.g. xxxx_xxxx_xxxx)"
                }
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-xl border border-slate-700 transition disabled:opacity-50"
              >
                {lookupLoading ? "Searching..." : "Lookup"}
              </button>
            </form>
          </div>
        </div>

        {/* Titles Table Card (GET /title/all) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Titles Catalog
              </h2>
              <p className="text-xs text-slate-400">
                <code className="text-indigo-400">GET /title/all</code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setOffset(0);
                }}
                placeholder="Filter catalog..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <label className="text-xs text-slate-400">Limit:</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <button
                onClick={fetchTitles}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="py-3.5 px-6">Title Badge / Name</th>
                  <th className="py-3.5 px-4">Title ID</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Created At</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Fetching titles from API...
                    </td>
                  </tr>
                ) : paginatedTitles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No titles found.
                    </td>
                  </tr>
                ) : (
                  paginatedTitles.map((title) => {
                    const unlocked = isUnlockedByMe(title.id);
                    return (
                      <tr
                        key={title.id}
                        className="hover:bg-slate-800/30 transition"
                      >
                        {/* Badge & Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                              ★ {title.name}
                            </span>
                            {unlocked && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Owned
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Title ID */}
                        <td className="py-4 px-4">
                          <div
                            className="font-mono text-xs text-indigo-300 truncate max-w-[180px]"
                            title={title.id}
                          >
                            {title.id}
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-4">
                          {title.description ? (
                            <p className="text-xs text-slate-300 max-w-md line-clamp-2">
                              {title.description}
                            </p>
                          ) : (
                            <span className="text-xs text-slate-500 italic">
                              No description provided
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(title.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            }
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openAssignModal("give", title)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition"
                            >
                              Give
                            </button>
                            <button
                              onClick={() => openAssignModal("revoke", title)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition"
                            >
                              Revoke
                            </button>
                            <button
                              onClick={() =>
                                handleTitleLookup(
                                  undefined,
                                  "titleId",
                                  title.id
                                )
                              }
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => openEditModal(title)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setTitleToDelete(title)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Offset <span className="text-white font-medium">{offset}</span> •{" "}
              Showing{" "}
              <span className="text-white font-medium">
                {paginatedTitles.length}
              </span>{" "}
              of <span className="text-white font-medium">{totalCount}</span>{" "}
              titles
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:pointer-events-none"
              >
                Previous
              </button>
              <span className="px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={offset + limit >= totalCount}
                onClick={() => setOffset(offset + limit)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ==========================================
          MODAL 1: Create Title (POST /title/new)
          ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Create New Title
                </h3>
                <p className="text-xs text-slate-400">
                  POST /title/new (ADMIN Only)
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTitle} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Title Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="all in one"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={createForm.description || ""}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="the person really likes to all in."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Title"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: Update Title (PATCH /title/update)
          ========================================== */}
      {titleToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Update Title</h3>
                <p className="text-xs text-slate-400 font-mono">
                  PATCH /title/update?titleId={titleToEdit.id}
                </p>
              </div>
              <button
                onClick={() => setTitleToEdit(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTitle} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Title Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTitleToEdit(null)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: Give / Revoke User Title
          (POST /title/give | DELETE /title/revoke)
          ========================================== */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {assignModal.mode === "give"
                    ? "Grant Title to User"
                    : "Revoke Title from User"}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {assignModal.mode === "give"
                    ? "POST /title/give?userId=...&titleId=..."
                    : "DELETE /title/revoke?userId=...&titleId=..."}
                </p>
              </div>
              <button
                onClick={() => setAssignModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignUserTitle} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target User ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assignForm.userId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, userId: e.target.value })
                  }
                  placeholder="01a105d0-bf8f-758a-a1ab-cf9098fded20"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Title <span className="text-rose-400">*</span>
                </label>
                {titles.length > 0 ? (
                  <select
                    value={assignForm.titleId}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, titleId: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {titles.map((t) => (
                      <option key={t.id} value={t.id}>
                        ★ {t.name} ({t.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={assignForm.titleId}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, titleId: e.target.value })
                    }
                    placeholder="Enter Title ID"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${
                    assignModal.mode === "give"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-amber-600 hover:bg-amber-500"
                  }`}
                >
                  {submitting
                    ? "Processing..."
                    : assignModal.mode === "give"
                    ? "Grant Title"
                    : "Revoke Title"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 4: Delete Confirmation (DELETE /title/delete)
          ========================================== */}
      {titleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete Title</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              DELETE /title/delete?titleId={titleToDelete.id}
            </p>
            <p className="text-sm text-slate-300 mt-4">
              Are you sure you want to permanently delete the title{" "}
              <span className="font-semibold text-amber-300">
                ★ {titleToDelete.name}
              </span>{" "}
              (<code className="text-indigo-300">{titleToDelete.id}</code>)?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTitleToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteTitle}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 5: Inspected Title Drawer (TitleDto)
          ========================================== */}
      {inspectedTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 h-full max-w-md w-full p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Title Details
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    GET /title/find
                  </p>
                </div>
                <button
                  onClick={() => setInspectedTitle(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Title Preview Card */}
              <div className="rounded-2xl p-5 border bg-gradient-to-br from-amber-950/40 via-slate-900 to-indigo-950/60 border-amber-500/30">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
                    ★ {inspectedTitle.name}
                  </span>
                  {isUnlockedByMe(inspectedTitle.id) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      UNLOCKED BY YOU
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs text-slate-300 italic bg-black/30 p-3 rounded-xl border border-white/5">
                  {inspectedTitle.description
                    ? `"${inspectedTitle.description}"`
                    : "No description set for this title."}
                </p>
              </div>

              {/* Fields Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Title ID</span>
                  <span className="text-indigo-300 font-mono">
                    {inspectedTitle.id}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Name</span>
                  <span className="text-slate-200 font-medium">
                    {inspectedTitle.name}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Created At</span>
                  <span className="text-slate-200">
                    {new Date(inspectedTitle.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quick Drawer Actions */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => openAssignModal("give", inspectedTitle)}
                  className="py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition"
                >
                  ★ Give to User
                </button>
                <button
                  onClick={() => openAssignModal("revoke", inspectedTitle)}
                  className="py-2 px-3 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
                >
                  Revoke from User
                </button>
                <button
                  onClick={() => openEditModal(inspectedTitle)}
                  className="py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => setTitleToDelete(inspectedTitle)}
                  className="py-2 px-3 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                >
                  Delete Title
                </button>
              </div>
            </div>

            <button
              onClick={() => setInspectedTitle(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
