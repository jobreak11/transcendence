"use client";

import React, { useState, useEffect, useCallback } from "react";

// ==========================================
// OpenAPI TypeScript Definitions
// ==========================================

export type Role = "ADMIN" | "EDITOR" | "USER";
export type Pronoun = "he/him" | "she/her" | "they/them" | "prefer not to say";
export type CardTheme = "STANDARD" | "FANTASY";

export interface UserProfileBase {
  displayName: string | null;
  avatarUrl: string | null;
  pronoun: Pronoun | null;
  signature: string | null;
  activeTitleId: string | null;
  cardTheme: CardTheme;
}

export interface UserProfileDto extends UserProfileBase {
  userId: string;
}

export interface UserAndProfileDto {
  id: string;
  tagId: string;
  email: string;
  password?: string;
  role: Role;
  hashedRefreshToken?: string | null;
  createdAt: string;
  user_profile: UserProfileDto | null;
}

export interface GetUserProfileDto {
  tagId: string;
  email: string;
  role: Role;
  createdAt: string;
  titleName: string | null;
  user_profile: UserProfileBase;
}

export interface CreateUserDto {
  email: string;
  password: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface UserSetRoleDto {
  userId: string;
  newRole: Role;
}

export interface GetUserTotalCountDto {
  totalUserCount: number;
}

// ==========================================
// Main Component
// ==========================================

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function SysAdminUserManagementPage() {
  // Auth Token State (auto-loads from localStorage if available)

  // Data & Pagination State
  const [users, setUsers] = useState<UserAndProfileDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Lookup State (/user/profile supports mutually exclusive `id` OR `tagId`)
  const [lookupMode, setLookupMode] = useState<"id" | "tagId">("tagId");
  const [lookupQuery, setLookupQuery] = useState<string>("");
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);

  // Modals & Drawers State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<UserAndProfileDto | null>(null);
  const [inspectedProfile, setInspectedProfile] =
    useState<GetUserProfileDto | null>(null);

  // Create Form State (CreateUserDto)
  const [createForm, setCreateForm] = useState<CreateUserDto>({
    email: "",
    password: "",
    displayName: "",
    avatarUrl: "",
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

  // 1. Fetch Users (GET /user?limit=...&offset=...) & Total Count (GET /user/totalCount)
  const fetchUsersAndCount = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, countRes] = await Promise.all([
        fetch(`/api/user?limit=${limit}&offset=${offset}`, {
          method: "GET",
          headers: getHeaders(),
        }),
        fetch(`/api/user/totalCount`, {
          method: "GET",
        }),
      ]);

      if (!usersRes.ok) {
        throw new Error(`Failed to fetch users (HTTP ${usersRes.status})`);
      }

      const usersData: UserAndProfileDto[] = await usersRes.json();
      setUsers(usersData);

      if (countRes.ok) {
        const countData: GetUserTotalCountDto = await countRes.json();
        setTotalCount(countData.totalUserCount);
      }
    } catch (err: any) {
      showToast("error", err.message || "Error connecting to backend service.");
    } finally {
      setLoading(false);
    }
  }, [limit, offset, getHeaders]);

  useEffect(() => {
    fetchUsersAndCount();
  }, [fetchUsersAndCount]);

  // 2. Lookup Single Profile (GET /user/profile?id=... OR ?tagId=...)
  const handleProfileLookup = async (
    e?: React.FormEvent,
    overrideMode?: "id" | "tagId",
    overrideValue?: string
  ) => {
    if (e) e.preventDefault();
    const mode = overrideMode || lookupMode;
    const query = (overrideValue ?? lookupQuery).trim();

    if (!query) {
      showToast("error", `Please enter a ${mode === "id" ? "User ID" : "Tag ID"}`);
      return;
    }

    setLookupLoading(true);
    try {
      // Strictly send ONLY `id` OR `tagId` (never both, avoiding 400 Bad Request)
      const param = new URLSearchParams({ [mode]: query });
      const res = await fetch(`/api/user/profile?${param.toString()}`, {
        method: "GET",
        headers: getHeaders(),
      });

      if (res.status === 400) {
        throw new Error("Bad Request (400): Both id and tagId were provided.");
      }
      if (res.status === 401) {
        throw new Error("Unauthorized (401): Missing or invalid JWT token.");
      }
      if (!res.ok) {
        throw new Error(`Profile lookup failed (HTTP ${res.status})`);
      }

      const profileData: GetUserProfileDto = await res.json();
      setInspectedProfile(profileData);
    } catch (err: any) {
      showToast("error", err.message || "Failed to lookup user profile.");
    } finally {
      setLookupLoading(false);
    }
  };

  // 3. Create User (POST /user/create)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password) {
      showToast("error", "Email and Password are required.");
      return;
    }

    setSubmitting(true);
    const payload: CreateUserDto = {
      email: createForm.email.trim(),
      password: createForm.password,
      displayName: createForm.displayName?.trim() || null,
      avatarUrl: createForm.avatarUrl?.trim() || null,
    };

    try {
      const res = await fetch(`/api/user/create`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        throw new Error("Unauthorized (401): Validation failed.");
      }
      if (!res.ok) {
        throw new Error(`Failed to create user (HTTP ${res.status})`);
      }

      showToast("success", "User created successfully.");
      setIsCreateModalOpen(false);
      setCreateForm({ email: "", password: "", displayName: "", avatarUrl: "" });
      fetchUsersAndCount();
    } catch (err: any) {
      showToast("error", err.message || "Error creating user.");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Set Role (POST /user/setRole)
  const handleSetRole = async (userId: string, newRole: Role) => {
    const payload: UserSetRoleDto = { userId, newRole };

    try {
      const res = await fetch(`/api/user/setRole`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to set role (HTTP ${res.status})`);
      }

      const updatedUser: UserAndProfileDto = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u))
      );
      showToast("success", `Role updated to ${newRole}.`);
    } catch (err: any) {
      showToast("error", err.message || "Could not update user role.");
    }
  };

  // 5. Delete User (DELETE /user/delete?userId=...)
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setSubmitting(true);

    try {
      const params = new URLSearchParams({ userId: userToDelete.id });
      const res = await fetch(`/api/user/delete?${params.toString()}`, {
        method: "DELETE",
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `Access Denied (${res.status}): Invalid role or missing/expired JWT token.`
        );
      }
      if (!res.ok && res.status !== 204) {
        throw new Error(`Delete failed (HTTP ${res.status})`);
      }

      showToast("success", "User permanently deleted.");
      setUserToDelete(null);
      fetchUsersAndCount();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete user.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // UI Helpers
  // ==========================================

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "EDITOR":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "USER":
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
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
              SysAdmin User Management
            </h1>
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <span>+</span> Create User
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
                Total Users
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">
                  {totalCount}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  /user/totalCount
                </span>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Current Page Roles
              </span>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="text-rose-400 font-semibold">
                  {users.filter((u) => u.role === "ADMIN").length} Admin
                </span>
                <span className="text-amber-400 font-semibold">
                  {users.filter((u) => u.role === "EDITOR").length} Editor
                </span>
                <span className="text-emerald-400 font-semibold">
                  {users.filter((u) => u.role === "USER").length} User
                </span>
              </div>
            </div>
          </div>

          {/* Exact Profile Lookup Bar (GET /user/profile) */}
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Profile Lookup (GET /user/profile)
              </span>
              <span className="text-[11px] text-slate-500">
                Requires Bearer JWT
              </span>
            </div>
            <form
              onSubmit={handleProfileLookup}
              className="flex flex-col sm:flex-row gap-2"
            >
              <select
                value={lookupMode}
                onChange={(e) => setLookupMode(e.target.value as "id" | "tagId")}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="tagId">By Tag ID (?tagId=)</option>
                <option value="id">By User ID (?id=)</option>
              </select>
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder={
                  lookupMode === "tagId"
                    ? "Enter tagId (e.g. gamer_tag_99)"
                    : "Enter user UUID (e.g. usr_12345)"
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

        {/* Users Table Card (GET /user) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Users List</h2>
              <p className="text-xs text-slate-400">
                <code className="text-indigo-400">
                  GET /user?limit={limit}&offset={offset}
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
                onClick={fetchUsersAndCount}
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
                  <th className="py-3.5 px-6">User / Display Name</th>
                  <th className="py-3.5 px-4">Tag ID & UUID</th>
                  <th className="py-3.5 px-4">Profile Details</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Created At</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Fetching users from API...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No users returned from API.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const profile = user.user_profile;
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-800/30 transition"
                      >
                        {/* Avatar + Display Name + Email */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-indigo-400">
                              {profile?.avatarUrl ? (
                                <img
                                  src={profile.avatarUrl}
                                  alt={profile.displayName || user.email}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (profile?.displayName || user.email)
                                  .charAt(0)
                                  .toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white flex items-center gap-2">
                                {profile?.displayName || (
                                  <span className="text-slate-500 italic">
                                    No Display Name
                                  </span>
                                )}
                                {profile?.pronoun && (
                                  <span className="text-[11px] font-normal px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                    {profile.pronoun}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tag ID & UUID */}
                        <td className="py-4 px-4">
                          <div className="font-mono text-xs text-indigo-300 font-medium">
                            #{user.tagId}
                          </div>
                          <div
                            className="font-mono text-[11px] text-slate-500 truncate max-w-[160px]"
                            title={user.id}
                          >
                            {user.id}
                          </div>
                        </td>

                        {/* Card Theme & Active Title */}
                        <td className="py-4 px-4">
                          {profile ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    profile.cardTheme === "FANTASY"
                                      ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                                      : "bg-slate-800 text-slate-300 border-slate-700"
                                  }`}
                                >
                                  {profile.cardTheme}
                                </span>
                                {profile.activeTitleId && (
                                  <span className="text-xs text-amber-300/90 truncate max-w-[140px]">
                                    ★ {profile.activeTitleId}
                                  </span>
                                )}
                              </div>
                              {profile.signature && (
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                  "{profile.signature}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">
                              No profile data
                            </span>
                          )}
                        </td>

                        {/* Role Switcher (POST /user/setRole) */}
                        <td className="py-4 px-4">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleSetRole(user.id, e.target.value as Role)
                            }
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border bg-transparent cursor-pointer focus:outline-none ${getRoleBadgeStyle(
                              user.role
                            )}`}
                          >
                            <option
                              value="USER"
                              className="bg-slate-900 text-emerald-400"
                            >
                              USER
                            </option>
                            <option
                              value="EDITOR"
                              className="bg-slate-900 text-amber-400"
                            >
                              EDITOR
                            </option>
                            <option
                              value="ADMIN"
                              className="bg-slate-900 text-rose-400"
                            >
                              ADMIN
                            </option>
                          </select>
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString(
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
                              onClick={() =>
                                handleProfileLookup(undefined, "id", user.id)
                              }
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => setUserToDelete(user)}
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
              <span className="text-white font-medium">{users.length}</span> of{" "}
              <span className="text-white font-medium">{totalCount}</span> total
              users
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
          MODAL 1: Create User (POST /user/create)
          ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Register New User
                </h3>
                <p className="text-xs text-slate-400">POST /user/create</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  placeholder="SecurePassword123"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Display Name <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={createForm.displayName || ""}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, displayName: e.target.value })
                  }
                  placeholder="InwZa007"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Avatar URL <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="url"
                  value={createForm.avatarUrl || ""}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, avatarUrl: e.target.value })
                  }
                  placeholder="https://example.com/avatar.png"
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
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: Delete Confirmation (DELETE /user/delete)
          ========================================== */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete User</h3>
            <p className="text-xs text-slate-400 mt-1">
              DELETE /user/delete?userId={userToDelete.id}
            </p>
            <p className="text-sm text-slate-300 mt-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {userToDelete.user_profile?.displayName || userToDelete.email}
              </span>{" "}
              (<code className="text-indigo-300">#{userToDelete.tagId}</code>)?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: Inspected Profile Drawer (GetUserProfileDto)
          ========================================== */}
      {inspectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 h-full max-w-md w-full p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">User Profile</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    GET /user/profile
                  </p>
                </div>
                <button
                  onClick={() => setInspectedProfile(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Profile Card */}
              <div
                className={`rounded-2xl p-5 border ${
                  inspectedProfile.user_profile.cardTheme === "FANTASY"
                    ? "bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 border-purple-500/40"
                    : "bg-slate-950 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-indigo-500/40 overflow-hidden flex items-center justify-center text-xl font-bold text-white">
                    {inspectedProfile.user_profile.avatarUrl ? (
                      <img
                        src={inspectedProfile.user_profile.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (
                        inspectedProfile.user_profile.displayName ||
                        inspectedProfile.email
                      )
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-white">
                        {inspectedProfile.user_profile.displayName ||
                          "Unnamed User"}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeStyle(
                          inspectedProfile.role
                        )}`}
                      >
                        {inspectedProfile.role}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-indigo-400">
                      #{inspectedProfile.tagId}
                    </p>
                    {inspectedProfile.titleName && (
                      <span className="inline-block mt-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        ★ {inspectedProfile.titleName}
                      </span>
                    )}
                  </div>
                </div>

                {inspectedProfile.user_profile.signature && (
                  <p className="mt-4 text-xs text-slate-300 italic bg-black/30 p-3 rounded-xl border border-white/5">
                    "{inspectedProfile.user_profile.signature}"
                  </p>
                )}
              </div>

              {/* Fields Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Email</span>
                  <span className="text-slate-200 font-medium">
                    {inspectedProfile.email}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Pronoun</span>
                  <span className="text-slate-200">
                    {inspectedProfile.user_profile.pronoun || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Card Theme</span>
                  <span className="text-slate-200 font-mono">
                    {inspectedProfile.user_profile.cardTheme}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Active Title ID</span>
                  <span className="text-slate-200">
                    {inspectedProfile.user_profile.activeTitleId || "None"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Created At</span>
                  <span className="text-slate-200">
                    {new Date(inspectedProfile.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setInspectedProfile(null)}
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