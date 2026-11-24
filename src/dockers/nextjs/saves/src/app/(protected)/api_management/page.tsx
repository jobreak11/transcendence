"use client";

import React, { useState, useEffect, useCallback } from "react";

// ==========================================
// 1. TypeScript Interfaces (from OpenAPI)
// ==========================================

export interface UsersApiKeyNoHashedDto {
  id: string;
  userId: string;
  keyName: string;
  keyPrefix: string;
  isRevoked: boolean;
  createdAt: string;
}

export interface UsersApiCreateDto {
  keyName: string;
}

export interface UsersApiCreateRawApiKeyDto extends UsersApiKeyNoHashedDto {
  rawApiKey: string; // DISPLAY ONE TIME ONLY!!
}

export interface UsersApiTotalUserApiCountDto {
  totalCount: number;
}

// ==========================================
// 2. Configuration & Helper
// ==========================================

const API_BASE_URL = "/api"; // Matches OpenAPI servers: [{ url: "/api" }]
const PAGE_LIMIT = 10;

export default function ApiManagementPage() {
  // Data States
  const [apiKeys, setApiKeys] = useState<UsersApiKeyNoHashedDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create API Key States
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newlyCreatedKey, setNewlyCreatedKey] =
    useState<UsersApiCreateRawApiKeyDto | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Find / Search API Key States
  const [searchMode, setSearchMode] = useState<"apiId" | "apiKey">("apiId");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResult, setSearchResult] =
    useState<UsersApiKeyNoHashedDto | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Revoke / Remove Confirmation Modal States
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "revoke" | "remove" | null;
    targetKey?: UsersApiKeyNoHashedDto;
  }>({ isOpen: false, type: null });
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  /**
   * FIX: Only attach "Content-Type: application/json" when hasJsonBody is true!
   * Sending "Content-Type: application/json" with an empty body on PATCH/DELETE
   * causes NestJS/Fastify/Express body parsers or Zod pipes to throw 400 Bad Request.
   */
  const getAuthHeaders = (hasJsonBody = false): HeadersInit => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return {
      Accept: "application/json",
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Helper to extract exact backend error messages on 400/401/etc.
  const parseErrorResponse = async (res: Response, fallbackMsg: string) => {
    try {
      const errData = await res.json();
      const detail = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message || errData?.error || JSON.stringify(errData);
      return `${fallbackMsg} (${res.status}: ${detail})`;
    } catch {
      return `${fallbackMsg} (Status: ${res.status})`;
    }
  };

  // ==========================================
  // 3. API Handlers
  // ==========================================

  // Fetch User's API Keys & Total Count
  const fetchUserApis = useCallback(async (currentOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, countRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/users-api?limit=${PAGE_LIMIT}&offset=${currentOffset}`,
          {
            method: "GET",
            headers: getAuthHeaders(false),
            credentials: "include",
          }
        ),
        fetch(`${API_BASE_URL}/users-api/totalUserApiCount`, {
          method: "GET",
          headers: getAuthHeaders(false),
          credentials: "include",
        }),
      ]);

      if (!listRes.ok) {
        throw new Error(
          await parseErrorResponse(listRes, "Failed to fetch API keys")
        );
      }

      const listData: UsersApiKeyNoHashedDto[] = await listRes.json();
      setApiKeys(listData);

      if (countRes.ok) {
        const countData: UsersApiTotalUserApiCountDto = await countRes.json();
        setTotalCount(countData.totalCount);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while loading keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserApis(offset);
  }, [offset, fetchUserApis]);

  // Request a New API Key (POST /api/users-api/request-new)
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const payload: UsersApiCreateDto = { keyName: newKeyName.trim() };
      const res = await fetch(`${API_BASE_URL}/users-api/request-new`, {
        method: "POST",
        headers: getAuthHeaders(true), // Has JSON body -> true
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(
          await parseErrorResponse(res, "Failed to create API key")
        );
      }

      const createdData: UsersApiCreateRawApiKeyDto = await res.json();
      setNewlyCreatedKey(createdData);
      setNewKeyName("");
      setCopied(false);

      // Refresh list
      await fetchUserApis(offset);
    } catch (err: any) {
      setError(err.message || "Could not create new API key.");
    } finally {
      setIsCreating(false);
    }
  };

  // Find a Specific API Key (GET /api/users-api/find)
  const handleFindApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const params = new URLSearchParams({
        [searchMode]: searchQuery.trim(),
      });
      const res = await fetch(
        `${API_BASE_URL}/users-api/find?${params.toString()}`,
        {
          method: "GET",
          headers: getAuthHeaders(false),
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(await parseErrorResponse(res, "API key not found"));
      }

      const foundData: UsersApiKeyNoHashedDto = await res.json();
      setSearchResult(foundData);
    } catch (err: any) {
      setError(err.message || "Could not find the requested API key.");
    } finally {
      setIsSearching(false);
    }
  };

  // Revoke (PATCH /api/users-api/revoke?apiId=...) or Remove (DELETE /api/users-api/remove?apiId=...)
  const handleExecuteAction = async () => {
    if (!actionModal.targetKey || !actionModal.type) return;

    // Safely resolve the ID whether backend returned `id` or `apiId`
    const rawId =
      actionModal.targetKey.id ?? (actionModal.targetKey as any).apiId;

    if (!rawId) {
      setError("Cannot perform action: API key ID is missing on this record.");
      return;
    }

    setIsProcessingAction(true);
    setError(null);

    const isRevoke = actionModal.type === "revoke";
    const params = new URLSearchParams({ apiId: String(rawId).trim() });
    const endpoint = isRevoke
      ? `${API_BASE_URL}/users-api/revoke?${params.toString()}`
      : `${API_BASE_URL}/users-api/remove?${params.toString()}`;
    const method = isRevoke ? "PATCH" : "DELETE";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders(false), // IMPORTANT: false -> Do NOT send Content-Type: application/json without a body
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(
          await parseErrorResponse(res, `Failed to ${actionModal.type} API key`)
        );
      }

      const updatedOrRemovedKey: UsersApiKeyNoHashedDto = await res.json();

      // Update search result preview if it matches the affected key
      if (searchResult && searchResult.id === rawId) {
        if (isRevoke) {
          setSearchResult(updatedOrRemovedKey);
        } else {
          setSearchResult(null);
        }
      }

      // Close modal & refresh list
      setActionModal({ isOpen: false, type: null });
      await fetchUserApis(offset);
    } catch (err: any) {
      setError(err.message || `Error trying to ${actionModal.type} API key.`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Copy raw key to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard permission fails
    }
  };

  // ==========================================
  // 4. UI Render
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              API Key Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Request new API credentials and manage your existing keys.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 flex items-center gap-3 self-start sm:self-auto">
            <div className="text-xs uppercase tracking-wider text-slate-400">
              Total Keys Owned
            </div>
            <div className="text-2xl font-bold text-indigo-400">
              {totalCount}
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-950/60 border border-red-800 text-red-200 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 font-medium ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Grid: Request New Key + Find Key */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Request New API Key Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white mb-1">
              Request New API Key
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Give your key a descriptive name to identify its usage.
            </p>
            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Key Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Production Match Tracker"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating || !newKeyName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-4 rounded-lg transition"
              >
                {isCreating ? "Generating Key..." : "+ Generate New API Key"}
              </button>
            </form>
          </div>

          {/* Find Specific API Key Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white mb-1">
              Find / Verify API Key
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Look up a key using its Database ID or Raw API Key.
            </p>
            <form onSubmit={handleFindApiKey} className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={searchMode}
                  onChange={(e) =>
                    setSearchMode(e.target.value as "apiId" | "apiKey")
                  }
                  className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="apiId">By API ID</option>
                  <option value="apiKey">By Raw Key</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder={
                    searchMode === "apiId"
                      ? "Enter API UUID..."
                      : "Enter Raw API Key..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition"
                >
                  {isSearching ? "Searching..." : "Search Key"}
                </button>
                {searchResult && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchResult(null);
                      setSearchQuery("");
                    }}
                    className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm py-2.5 px-3 rounded-lg"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {/* Search Result Box */}
            {searchResult && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-300 text-sm">
                    {searchResult.keyName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      searchResult.isRevoked
                        ? "bg-red-950 text-red-300 border border-red-800"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    }`}
                  >
                    {searchResult.isRevoked ? "Revoked" : "Active"}
                  </span>
                </div>
                <div className="text-slate-400">
                  <strong className="text-slate-300">Prefix:</strong>{" "}
                  <code className="text-amber-300">
                    {searchResult.keyPrefix}...
                  </code>
                </div>
                <div className="text-slate-400">
                  <strong className="text-slate-300">ID:</strong>{" "}
                  {searchResult.id}
                </div>
                <div className="text-slate-400">
                  <strong className="text-slate-300">Created:</strong>{" "}
                  {new Date(searchResult.createdAt).toLocaleString()}
                </div>
                <div className="pt-2 flex gap-2 border-t border-slate-800/80">
                  {!searchResult.isRevoked && (
                    <button
                      type="button"
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          type: "revoke",
                          targetKey: searchResult,
                        })
                      }
                      className="text-xs bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded-md transition"
                    >
                      Revoke
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setActionModal({
                        isOpen: true,
                        type: "remove",
                        targetKey: searchResult,
                      })
                    }
                    className="text-xs bg-red-950/60 hover:bg-red-900/70 text-red-300 border border-red-800/60 px-2.5 py-1 rounded-md transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Keys Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Your API Keys</h2>
              <p className="text-xs text-slate-400">
                Manage your active and revoked API keys directly by ID.
              </p>
            </div>
            <button
              onClick={() => fetchUserApis(offset)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading your API keys...
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              You don&apos;t have any API keys yet. Create one above to get
              started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/50">
                    <th className="py-3.5 px-6">Key Name</th>
                    <th className="py-3.5 px-6">Prefix</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Created At</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {apiKeys.map((key) => {
                    const resolvedId = key.id ?? (key as any).apiId;
                    return (
                      <tr
                        key={resolvedId}
                        className="hover:bg-slate-800/30 transition"
                      >
                        <td className="py-4 px-6 font-medium text-white">
                          <div>{key.keyName}</div>
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                            ID: {resolvedId}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <code className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-xs text-amber-300">
                            {key.keyPrefix}...
                          </code>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              key.isRevoked
                                ? "bg-red-950/80 text-red-300 border border-red-800/60"
                                : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                            }`}
                          >
                            {key.isRevoked ? "Revoked" : "Active"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 text-xs">
                          {new Date(key.createdAt).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          {!key.isRevoked && (
                            <button
                              onClick={() =>
                                setActionModal({
                                  isOpen: true,
                                  type: "revoke",
                                  targetKey: key,
                                })
                              }
                              className="text-xs bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-800/60 px-3 py-1.5 rounded-lg transition"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setActionModal({
                                isOpen: true,
                                type: "remove",
                                targetKey: key,
                              })
                            }
                            className="text-xs bg-red-950/60 hover:bg-red-900/70 text-red-300 border border-red-800/60 px-3 py-1.5 rounded-lg transition"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing{" "}
              <span className="font-medium text-slate-200">
                {apiKeys.length > 0 ? offset + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-200">
                {offset + apiKeys.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-200">{totalCount}</span>{" "}
              keys
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_LIMIT))}
                disabled={offset === 0 || loading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + PAGE_LIMIT)}
                disabled={offset + PAGE_LIMIT >= totalCount || loading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MODAL 1: ONE-TIME RAW API KEY DISPLAY
      ========================================================= */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 mb-2">
                API Key Created
              </span>
              <h3 className="text-xl font-bold text-white">
                Save Your Raw API Key
              </h3>
            </div>

            <div className="bg-amber-950/50 border border-amber-800/80 text-amber-200 p-3.5 rounded-xl text-xs leading-relaxed">
              <strong>Important:</strong> For security reasons, this raw API key
              will{" "}
              <span className="underline font-semibold">
                only be displayed once
              </span>
              . Store it securely now—you will not be able to view it again.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">
                Key Name:{" "}
                <strong className="text-slate-200">
                  {newlyCreatedKey.keyName}
                </strong>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={newlyCreatedKey.rawApiKey}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-emerald-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(newlyCreatedKey.rawApiKey)}
                  className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition"
                >
                  {copied ? "Copied!" : "Copy Key"}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setNewlyCreatedKey(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
              >
                I Have Saved My Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: REVOKE OR REMOVE CONFIRMATION (Uses ?apiId=...)
      ========================================================= */}
      {actionModal.isOpen && actionModal.targetKey && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white capitalize">
                Confirm {actionModal.type} API Key
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {actionModal.type === "revoke"
                  ? "Revoking this key will immediately disable it from making authenticated requests."
                  : "Removing this key will permanently delete it from your account. This action cannot be undone."}
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Name:</span>{" "}
                <strong className="text-white">
                  {actionModal.targetKey.keyName}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Prefix:</span>{" "}
                <code className="text-amber-300">
                  {actionModal.targetKey.keyPrefix}...
                </code>
              </div>
              <div>
                <span className="text-slate-400">API ID:</span>{" "}
                <span className="text-slate-300 font-mono">
                  {actionModal.targetKey.id ??
                    (actionModal.targetKey as any).apiId}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setActionModal({ isOpen: false, type: null })}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleExecuteAction}
                className={`px-4 py-2 rounded-lg text-white text-xs font-medium transition disabled:opacity-50 ${
                  actionModal.type === "revoke"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {isProcessingAction
                  ? "Processing..."
                  : actionModal.type === "revoke"
                  ? "Yes, Revoke Key"
                  : "Yes, Permanently Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
