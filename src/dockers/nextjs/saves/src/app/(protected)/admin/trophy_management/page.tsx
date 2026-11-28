"use client";

import React, { useState, useEffect, useCallback } from "react";

// ==========================================
// OpenAPI TypeScript Definitions (Trophies)
// ==========================================

export interface TrophyDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export type GetTrophyDto = TrophyDto;

export interface CreateNewTrophyDto {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
}

export interface TrophiesUpdateDto {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
}

export interface GetUserTrophyDto {
  unlockedAt: string;
  trophy: TrophyDto;
}

export interface GetAllUserTrophiesCountDto {
  totalCount: number;
}

export interface GetAllTrophiesCountDto {
  totalCount: number;
}

export interface NewUserTrophyDto {
  userId: string;
  trophyId: string;
  unlockedAt: string;
}

export interface UserTrophyDto {
  userId: string;
  trophyId: string;
  unlockedAt: string;
}

// ==========================================
// Main Component
// ==========================================

export default function SysAdminTrophyManagementPage() {
  // Data & Pagination State
  const [trophies, setTrophies] = useState<TrophyDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Single Trophy Lookup State (GET /api/trophies/find?trophyId=...)
  const [lookupTrophyId, setLookupTrophyId] = useState<string>("");
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [inspectedTrophy, setInspectedTrophy] = useState<GetTrophyDto | null>(null);

  // User Trophies Inspector State (GET /api/trophies & GET /api/trophies/totalUserCount)
  const [userSearchId, setUserSearchId] = useState<string>("");
  const [userTrophies, setUserTrophies] = useState<GetUserTrophyDto[]>([]);
  const [userTrophyCount, setUserTrophyCount] = useState<number | null>(null);
  const [userTrophiesLoading, setUserTrophiesLoading] = useState<boolean>(false);
  const [isUserTrophiesDrawerOpen, setIsUserTrophiesDrawerOpen] = useState<boolean>(false);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [trophyToEdit, setTrophyToEdit] = useState<TrophyDto | null>(null);
  const [trophyToUploadPic, setTrophyToUploadPic] = useState<TrophyDto | null>(null);
  const [trophyToDelete, setTrophyToDelete] = useState<TrophyDto | null>(null);
  const [grantRevokeModal, setGrantRevokeModal] = useState<{
    mode: "give" | "revoke";
    trophy?: TrophyDto;
  } | null>(null);

  // Form States
  const [createForm, setCreateForm] = useState<CreateNewTrophyDto>({
    name: "",
    description: "",
    imageUrl: "",
  });

  const [editForm, setEditForm] = useState<TrophiesUpdateDto>({
    name: "",
    description: "",
    imageUrl: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetUserIdInput, setTargetUserIdInput] = useState<string>("");
  const [targetTrophyIdInput, setTargetTrophyIdInput] = useState<string>("");
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
    return {
      "Content-Type": "application/json",
    };
  }, []);

  // ==========================================
  // API Handlers
  // ==========================================

  // 1. Fetch All Trophies (GET /api/trophies/dev/all) & Total Count (GET /api/trophies/allTotalCount)
  const fetchTrophiesAndCount = useCallback(async () => {
    setLoading(true);
    try {
      const [trophiesRes, countRes] = await Promise.all([
        fetch(`/api/trophies/dev/all?limit=${limit}&offset=${offset}`, {
          method: "GET",
          headers: getHeaders(),
        }),
        fetch(`/api/trophies/allTotalCount`, {
          method: "GET",
        }),
      ]);

      if (!trophiesRes.ok) {
        throw new Error(`Failed to fetch trophies (HTTP ${trophiesRes.status})`);
      }

      const trophiesData: TrophyDto[] = await trophiesRes.json();
      setTrophies(trophiesData);

      if (countRes.ok) {
        const countData: GetAllTrophiesCountDto = await countRes.json();
        setTotalCount(countData.totalCount);
      }
    } catch (err: any) {
      showToast("error", err.message || "Error connecting to backend service.");
    } finally {
      setLoading(false);
    }
  }, [limit, offset, getHeaders]);

  useEffect(() => {
    fetchTrophiesAndCount();
  }, [fetchTrophiesAndCount]);

  // 2. Lookup Single Trophy (GET /api/trophies/find?trophyId=...)
  const handleTrophyLookup = async (e?: React.FormEvent, overrideId?: string) => {
    if (e) e.preventDefault();
    const query = (overrideId ?? lookupTrophyId).trim();

    if (!query) {
      showToast("error", "Please enter a Trophy UUID.");
      return;
    }

    setLookupLoading(true);
    try {
      const params = new URLSearchParams({ trophyId: query });
      const res = await fetch(`/api/trophies/find?${params.toString()}`, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Trophy lookup failed (HTTP ${res.status})`);
      }

      const data: GetTrophyDto = await res.json();
      setInspectedTrophy(data);
    } catch (err: any) {
      showToast("error", err.message || "Failed to find trophy.");
    } finally {
      setLookupLoading(false);
    }
  };

  // 3. Lookup User's Trophies & Count (GET /api/trophies & GET /api/trophies/totalUserCount)
  const handleUserTrophiesLookup = async (e?: React.FormEvent, overrideUserId?: string) => {
    if (e) e.preventDefault();
    const uid = (overrideUserId ?? userSearchId).trim();

    if (!uid) {
      showToast("error", "Please enter a User UUID to inspect their trophies.");
      return;
    }

    setUserTrophiesLoading(true);
    try {
      const params = new URLSearchParams({ userId: uid, limit: "50", offset: "0" });
      const countParams = new URLSearchParams({ userId: uid });

      const [listRes, countRes] = await Promise.all([
        fetch(`/api/trophies?${params.toString()}`, { method: "GET" }),
        fetch(`/api/trophies/totalUserCount?${countParams.toString()}`, { method: "GET" }),
      ]);

      if (!listRes.ok) {
        throw new Error(`Failed to fetch user trophies (HTTP ${listRes.status})`);
      }

      const listData: GetUserTrophyDto[] = await listRes.json();
      setUserTrophies(listData);

      if (countRes.ok) {
        const countData: GetAllUserTrophiesCountDto = await countRes.json();
        setUserTrophyCount(countData.totalCount);
      } else {
        setUserTrophyCount(listData.length);
      }

      setIsUserTrophiesDrawerOpen(true);
    } catch (err: any) {
      showToast("error", err.message || "Failed to fetch user trophies.");
    } finally {
      setUserTrophiesLoading(false);
    }
  };

  // 4. Create Trophy (POST /api/trophies/dev/create)
  const handleCreateTrophy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      showToast("error", "Trophy name is required.");
      return;
    }

    setSubmitting(true);
    const payload: CreateNewTrophyDto = {
      name: createForm.name.trim(),
      description: createForm.description?.trim() || null,
      imageUrl: createForm.imageUrl?.trim() || null,
    };

    try {
      const res = await fetch(`/api/trophies/dev/create`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to create trophy (HTTP ${res.status})`);
      }

      showToast("success", "Trophy created successfully.");
      setIsCreateModalOpen(false);
      setCreateForm({ name: "", description: "", imageUrl: "" });
      fetchTrophiesAndCount();
    } catch (err: any) {
      showToast("error", err.message || "Error creating trophy.");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Update Trophy (PATCH /api/trophies/dev/update?trophyId=...)
  const handleUpdateTrophy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trophyToEdit) return;

    setSubmitting(true);
    const payload: TrophiesUpdateDto = {
      name: editForm.name?.trim(),
      description: editForm.description?.trim() || null,
      imageUrl: editForm.imageUrl?.trim() || null,
    };

    try {
      const params = new URLSearchParams({ trophyId: trophyToEdit.id });
      const res = await fetch(`/api/trophies/dev/update?${params.toString()}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to update trophy (HTTP ${res.status})`);
      }

      const updated: GetTrophyDto = await res.json();
      setTrophies((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (inspectedTrophy?.id === updated.id) {
        setInspectedTrophy(updated);
      }

      showToast("success", "Trophy updated successfully.");
      setTrophyToEdit(null);
    } catch (err: any) {
      showToast("error", err.message || "Error updating trophy.");
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Upload Trophy Picture (POST /api/trophies/dev/uploadPic?trophyId=...)
  const handleUploadPic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trophyToUploadPic || !selectedFile) {
      showToast("error", "Please select an image file (JPG).");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const params = new URLSearchParams({ trophyId: trophyToUploadPic.id });
      const res = await fetch(`/api/trophies/dev/uploadPic?${params.toString()}`, {
        method: "POST",
        body: formData, // Browser automatically sets Content-Type with multipart boundary
      });

      if (!res.ok) {
        throw new Error(`Failed to upload image (HTTP ${res.status})`);
      }

      const updated: GetTrophyDto = await res.json();
      setTrophies((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (inspectedTrophy?.id === updated.id) {
        setInspectedTrophy(updated);
      }

      showToast("success", "Trophy image uploaded successfully.");
      setTrophyToUploadPic(null);
      setSelectedFile(null);
    } catch (err: any) {
      showToast("error", err.message || "Error uploading trophy image.");
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Give or Revoke User Trophy
  // Give: POST /api/trophies/dev/give?targetUserId=...&targetTrophyId=...
  // Revoke: DELETE /api/trophies/dev/revoke?userId=...&trophyId=...
  const handleGrantOrRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantRevokeModal) return;

    const uid = targetUserIdInput.trim();
    const tid = (grantRevokeModal.trophy?.id || targetTrophyIdInput).trim();

    if (!uid || !tid) {
      showToast("error", "Both User ID and Trophy ID are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (grantRevokeModal.mode === "give") {
        const params = new URLSearchParams({
          targetUserId: uid,
          targetTrophyId: tid,
        });
        const res = await fetch(`/api/trophies/dev/give?${params.toString()}`, {
          method: "POST",
        });

        if (!res.ok) {
          throw new Error(`Failed to give trophy (HTTP ${res.status})`);
        }
        showToast("success", `Trophy granted to user ${uid}.`);
      } else {
        const params = new URLSearchParams({
          userId: uid,
          trophyId: tid,
        });
        const res = await fetch(`/api/trophies/dev/revoke?${params.toString()}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error(`Failed to revoke trophy (HTTP ${res.status})`);
        }
        showToast("success", `Trophy revoked from user ${uid}.`);
      }

      setGrantRevokeModal(null);
      setTargetUserIdInput("");
      setTargetTrophyIdInput("");
    } catch (err: any) {
      showToast("error", err.message || `Failed to ${grantRevokeModal.mode} trophy.`);
    } finally {
      setSubmitting(false);
    }
  };

  // 8. Delete Trophy (DELETE /api/trophies/dev/delete?trophyId=...)
  const handleDeleteTrophy = async () => {
    if (!trophyToDelete) return;

    setSubmitting(true);
    try {
      const params = new URLSearchParams({ trophyId: trophyToDelete.id });
      const res = await fetch(`/api/trophies/dev/delete?${params.toString()}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Delete failed (HTTP ${res.status})`);
      }

      showToast("success", "Trophy permanently deleted.");
      if (inspectedTrophy?.id === trophyToDelete.id) {
        setInspectedTrophy(null);
      }
      setTrophyToDelete(null);
      fetchTrophiesAndCount();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete trophy.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Helpers
  // ==========================================

  const openEditModal = (trophy: TrophyDto) => {
    setTrophyToEdit(trophy);
    setEditForm({
      name: trophy.name,
      description: trophy.description || "",
      imageUrl: trophy.imageUrl || "",
    });
  };

  const openGrantModal = (mode: "give" | "revoke", trophy?: TrophyDto) => {
    setGrantRevokeModal({ mode, trophy });
    setTargetTrophyIdInput(trophy?.id || "");
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

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
              SysAdmin Trophy Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openGrantModal("give")}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition"
            >
              ★ Give Trophy
            </button>
            <button
              onClick={() => openGrantModal("revoke")}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
            >
              ⊘ Revoke Trophy
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <span>+</span> Create Trophy
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metrics & Lookup Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Metric Cards */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Trophies
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">
                  {totalCount}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  /trophies/allTotalCount
                </span>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Page Media Status
              </span>
              <div className="mt-2 flex flex-col gap-1 text-xs">
                <span className="text-emerald-400 font-semibold">
                  {trophies.filter((t) => Boolean(t.imageUrl)).length} With Image
                </span>
                <span className="text-slate-400 font-semibold">
                  {trophies.filter((t) => !t.imageUrl).length} No Image
                </span>
              </div>
            </div>
          </div>

          {/* Find Trophy by ID (GET /api/trophies/find) */}
          <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Find Trophy (GET /trophies/find)
              </span>
            </div>
            <form onSubmit={handleTrophyLookup} className="flex gap-2">
              <input
                type="text"
                value={lookupTrophyId}
                onChange={(e) => setLookupTrophyId(e.target.value)}
                placeholder="Enter trophyId UUID..."
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-xl border border-slate-700 transition disabled:opacity-50"
              >
                {lookupLoading ? "..." : "Find"}
              </button>
            </form>
          </div>

          {/* Lookup User's Trophies (GET /api/trophies?userId=...) */}
          <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                User Trophies (GET /trophies)
              </span>
            </div>
            <form onSubmit={handleUserTrophiesLookup} className="flex gap-2">
              <input
                type="text"
                value={userSearchId}
                onChange={(e) => setUserSearchId(e.target.value)}
                placeholder="Enter userId UUID..."
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={userTrophiesLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium rounded-xl border border-slate-700 transition disabled:opacity-50"
              >
                {userTrophiesLoading ? "..." : "Inspect"}
              </button>
            </form>
          </div>
        </div>

        {/* Trophies Table Card (GET /api/trophies/dev/all) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Trophies Catalog</h2>
              <p className="text-xs text-slate-400">
                <code className="text-indigo-400">
                  GET /api/trophies/dev/all?limit={limit}&offset={offset}
                </code>
              </p>
            </div>

            <div className="flex items-center gap-3">
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
                onClick={fetchTrophiesAndCount}
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
                  <th className="py-3.5 px-6">Trophy / Name</th>
                  <th className="py-3.5 px-4">Trophy UUID</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Created At</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Fetching trophies from API...
                    </td>
                  </tr>
                ) : trophies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No trophies returned from API.
                    </td>
                  </tr>
                ) : (
                  trophies.map((trophy) => (
                    <tr
                      key={trophy.id}
                      className="hover:bg-slate-800/30 transition"
                    >
                      {/* Image + Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-base font-bold text-amber-400">
                            {trophy.imageUrl ? (
                              <img
                                src={trophy.imageUrl}
                                alt={trophy.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              "🏆"
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {trophy.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {trophy.imageUrl || "No image uploaded"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* UUID */}
                      <td className="py-4 px-4">
                        <div
                          className="font-mono text-xs text-indigo-300 truncate max-w-[180px]"
                          title={trophy.id}
                        >
                          {trophy.id}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-4">
                        {trophy.description ? (
                          <p className="text-xs text-slate-300 max-w-xs truncate">
                            {trophy.description}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            No description
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(trophy.createdAt).toLocaleDateString(
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleTrophyLookup(undefined, trophy.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => openEditModal(trophy)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setTrophyToUploadPic(trophy);
                              setSelectedFile(null);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition"
                          >
                            Upload Pic
                          </button>
                          <button
                            onClick={() => openGrantModal("give", trophy)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition"
                          >
                            Give
                          </button>
                          <button
                            onClick={() => setTrophyToDelete(trophy)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Offset <span className="text-white font-medium">{offset}</span> •{" "}
              Showing{" "}
              <span className="text-white font-medium">{trophies.length}</span>{" "}
              of <span className="text-white font-medium">{totalCount}</span>{" "}
              total trophies
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
          MODAL 1: Create Trophy (POST /api/trophies/dev/create)
          ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Create New Trophy</h3>
                <p className="text-xs text-slate-400 font-mono">
                  POST /api/trophies/dev/create
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrophy} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Trophy Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="champion trophy"
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
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  placeholder="Awarded to tournament champions..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Image URL <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={createForm.imageUrl || ""}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/trophy.jpg"
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
                  {submitting ? "Creating..." : "Create Trophy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: Update Trophy (PATCH /api/trophies/dev/update)
          ========================================== */}
      {trophyToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Update Trophy</h3>
                <p className="text-xs text-slate-400 font-mono">
                  PATCH /api/trophies/dev/update?trophyId={trophyToEdit.id}
                </p>
              </div>
              <button
                onClick={() => setTrophyToEdit(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTrophy} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Trophy Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
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

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={editForm.imageUrl || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, imageUrl: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTrophyToEdit(null)}
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
          MODAL 3: Upload Trophy Picture (POST /api/trophies/dev/uploadPic)
          ========================================== */}
      {trophyToUploadPic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Upload Trophy Picture
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  POST /api/trophies/dev/uploadPic?trophyId={trophyToUploadPic.id}
                </p>
              </div>
              <button
                onClick={() => setTrophyToUploadPic(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadPic} className="space-y-4">
              <div className="text-xs text-slate-300">
                Target Trophy:{" "}
                <span className="font-semibold text-white">
                  {trophyToUploadPic.name}
                </span>
              </div>

              <div className="border-2 border-dashed border-slate-800 rounded-xl p-5 text-center bg-slate-950/60">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0] || null)
                  }
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-2">
                  Multipart form-data field: <code>file</code> (Trophy image file JPG)
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTrophyToUploadPic(null)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedFile}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
                >
                  {submitting ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 4: Give / Revoke Trophy
          (POST /api/trophies/dev/give | DELETE /api/trophies/dev/revoke)
          ========================================== */}
      {grantRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {grantRevokeModal.mode === "give"
                    ? "Give Trophy to User"
                    : "Revoke Trophy from User"}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {grantRevokeModal.mode === "give"
                    ? "POST /api/trophies/dev/give?targetUserId=...&targetTrophyId=..."
                    : "DELETE /api/trophies/dev/revoke?userId=...&trophyId=..."}
                </p>
              </div>
              <button
                onClick={() => setGrantRevokeModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantOrRevoke} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target User UUID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetUserIdInput}
                  onChange={(e) => setTargetUserIdInput(e.target.value)}
                  placeholder="01a220a2-f760-72cf-a319-..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Trophy UUID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetTrophyIdInput}
                  onChange={(e) => setTargetTrophyIdInput(e.target.value)}
                  placeholder="01a220a2-f761-73cb-9922-..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                {grantRevokeModal.trophy && (
                  <p className="text-xs text-amber-400 mt-1">
                    Selected: ★ {grantRevokeModal.trophy.name}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setGrantRevokeModal(null)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${
                    grantRevokeModal.mode === "give"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-amber-600 hover:bg-amber-500"
                  }`}
                >
                  {submitting
                    ? "Processing..."
                    : grantRevokeModal.mode === "give"
                    ? "Confirm Give"
                    : "Confirm Revoke"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 5: Delete Confirmation (DELETE /api/trophies/dev/delete)
          ========================================== */}
      {trophyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete Trophy</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              DELETE /api/trophies/dev/delete?trophyId={trophyToDelete.id}
            </p>
            <p className="text-sm text-slate-300 mt-4">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-white">
                {trophyToDelete.name}
              </span>
              ?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTrophyToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteTrophy}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DRAWER 1: Inspected Single Trophy (GetTrophyDto)
          ========================================== */}
      {inspectedTrophy && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 h-full max-w-md w-full p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Trophy Details</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    GET /api/trophies/find?trophyId={inspectedTrophy.id}
                  </p>
                </div>
                <button
                  onClick={() => setInspectedTrophy(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Trophy Showcase Card */}
              <div className="rounded-2xl p-5 border bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-500/40 overflow-hidden flex items-center justify-center text-2xl">
                    {inspectedTrophy.imageUrl ? (
                      <img
                        src={inspectedTrophy.imageUrl}
                        alt={inspectedTrophy.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "🏆"
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      {inspectedTrophy.name}
                    </h4>
                    <p className="text-xs font-mono text-amber-400 break-all">
                      {inspectedTrophy.id}
                    </p>
                  </div>
                </div>
                {inspectedTrophy.description && (
                  <p className="mt-4 text-xs text-slate-300 bg-black/30 p-3 rounded-xl border border-white/5">
                    {inspectedTrophy.description}
                  </p>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Image URL</span>
                  <span className="text-slate-200 font-mono truncate max-w-[220px]">
                    {inspectedTrophy.imageUrl || "None"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Created At</span>
                  <span className="text-slate-200">
                    {new Date(inspectedTrophy.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  const t = inspectedTrophy;
                  setInspectedTrophy(null);
                  openEditModal(t);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition"
              >
                Edit Trophy
              </button>
              <button
                onClick={() => setInspectedTrophy(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DRAWER 2: User's Unlocked Trophies (GET /api/trophies)
          ========================================== */}
      {isUserTrophiesDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 h-full max-w-md w-full p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    User Unlocked Trophies
                  </h3>
                  <p className="text-xs text-slate-400 font-mono break-all">
                    User: {userSearchId}
                  </p>
                </div>
                <button
                  onClick={() => setIsUserTrophiesDrawerOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Total Unlocked (/trophies/totalUserCount)
                </span>
                <span className="text-lg font-bold text-amber-400">
                  {userTrophyCount ?? userTrophies.length}
                </span>
              </div>

              <div className="space-y-3">
                {userTrophies.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    This user has not unlocked any trophies yet.
                  </p>
                ) : (
                  userTrophies.map((item) => (
                    <div
                      key={item.trophy.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
                          {item.trophy.imageUrl ? (
                            <img
                              src={item.trophy.imageUrl}
                              alt={item.trophy.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            "🏆"
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {item.trophy.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Unlocked:{" "}
                            {new Date(item.unlockedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsUserTrophiesDrawerOpen(false);
                          setGrantRevokeModal({
                            mode: "revoke",
                            trophy: item.trophy,
                          });
                          setTargetUserIdInput(userSearchId);
                          setTargetTrophyIdInput(item.trophy.id);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                      >
                        Revoke
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setIsUserTrophiesDrawerOpen(false)}
              className="w-full mt-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
