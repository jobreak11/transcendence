"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ==========================================
// OpenAPI Subset Types for Overview Dashboard
// ==========================================

interface GetUserTotalCountDto {
  totalUserCount: number;
}

interface UserAndProfileDto {
  id: string;
  tagId: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "USER";
  createdAt: string;
  user_profile: {
    displayName: string | null;
    avatarUrl: string | null;
    activeTitleId: string | null;
  } | null;
}

interface TitleDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface GetLobbyPublicDto {
  details: {
    roomPinId: string;
    roomStatus: "UNAVAILABLE" | "WAITING" | "PLAYING";
    currentPlayerCount: number;
  };
}

export default function SysAdminOverviewPage() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [recentUsers, setRecentUsers] = useState<UserAndProfileDto[]>([]);
  const [titles, setTitles] = useState<TitleDto[]>([]);
  const [lobbies, setLobbies] = useState<GetLobbyPublicDto[]>([]);
  const [backendHello, setBackendHello] = useState<string>("Checking...");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardSummary = useCallback(async () => {
    setLoading(true);
    try {
      const [countRes, usersRes, titlesRes, lobbiesRes, helloRes] =
        await Promise.allSettled([
          fetch("/api/user/totalCount"),
          fetch("/api/user?limit=5&offset=0"),
          fetch("/api/title/all"),
          fetch("/api/game/lobby/allRooms"),
          fetch("/api/hello"),
        ]);

      if (countRes.status === "fulfilled" && countRes.value.ok) {
        const data: GetUserTotalCountDto = await countRes.value.json();
        setTotalUsers(data.totalUserCount);
      }

      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        const data: UserAndProfileDto[] = await usersRes.value.json();
        setRecentUsers(data);
      }

      if (titlesRes.status === "fulfilled" && titlesRes.value.ok) {
        const data: TitleDto[] = await titlesRes.value.json();
        setTitles(data);
      }

      if (lobbiesRes.status === "fulfilled" && lobbiesRes.value.ok) {
        const data: GetLobbyPublicDto[] = await lobbiesRes.value.json();
        setLobbies(data);
      }

      if (helloRes.status === "fulfilled" && helloRes.value.ok) {
        const text = await helloRes.value.text();
        setBackendHello(text.replace(/^"|"$/g, "") || "Online (200 OK)");
      } else {
        setBackendHello("Unreachable");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              System Administration Overview
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Central portal for managing users, roles, titles, and system status
            </p>
          </div>
          <button
            onClick={fetchDashboardSummary}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            ↻ Refresh Metrics
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Primary Module Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Management Card */}
          <Link
            href="/admin/user_management"
            className="group relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-6 transition shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  User Controller
                </span>
                <span className="text-xs font-mono text-slate-400 group-hover:text-indigo-300 transition">
                  /admin/users →
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-4 group-hover:text-indigo-300 transition">
                User & Role Management
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Inspect user profiles by ID or Tag ID, register accounts, switch
                user roles (USER, EDITOR, ADMIN), and remove users.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Total Registered:{" "}
                <strong className="text-white">{totalUsers}</strong>
              </span>
              <span className="font-semibold text-indigo-400 group-hover:underline">
                Open User Console
              </span>
            </div>
          </Link>

          {/* Title Management Card */}
          <Link
            href="/admin/title_management"
            className="group relative bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 transition shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Title Controller
                </span>
                <span className="text-xs font-mono text-slate-400 group-hover:text-amber-300 transition">
                  /admin/titles →
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-4 group-hover:text-amber-300 transition">
                Title Catalog & Grants
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Create and update achievement titles, lookup title metadata, and
                grant or revoke titles for specific users.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Available Titles:{" "}
                <strong className="text-amber-300">{titles.length}</strong>
              </span>
              <span className="font-semibold text-amber-400 group-hover:underline">
                Open Title Console
              </span>
            </div>
          </Link>
        </div>

        {/* Live System Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Users
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">
                {loading ? "—" : totalUsers}
              </span>
              <span className="text-xs font-mono text-slate-500">
                /user/totalCount
              </span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Titles
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-amber-400">
                {loading ? "—" : titles.length}
              </span>
              <span className="text-xs font-mono text-slate-500">
                /title/all
              </span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Active Game Lobbies
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-400">
                {loading ? "—" : lobbies.length}
              </span>
              <span className="text-xs font-mono text-slate-500">
                /game/lobby/allRooms
              </span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Backend Health (/hello)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm font-bold text-indigo-300 truncate max-w-[160px]">
                {backendHello}
              </span>
              <span className="text-xs font-mono text-slate-500">GET /hello</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Previews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users Preview */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Users</h3>
                <p className="text-xs text-slate-400 font-mono">
                  GET /user?limit=5&offset=0
                </p>
              </div>
              <Link
                href="/admin/user_management"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Manage All →
              </Link>
            </div>

            <div className="divide-y divide-slate-800/60">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Loading users...
                </div>
              ) : recentUsers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No users found.
                </div>
              ) : (
                recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-slate-800/30 transition"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {u.user_profile?.displayName || u.email}
                      </div>
                      <div className="text-slate-400 font-mono">
                        #{u.tagId} • {u.email}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {u.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Titles Preview */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Available Titles
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  GET /title/all
                </p>
              </div>
              <Link
                href="/admin/titles"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                Manage All →
              </Link>
            </div>

            <div className="divide-y divide-slate-800/60">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Loading titles...
                </div>
              ) : titles.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No titles created yet.
                </div>
              ) : (
                titles.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-slate-800/30 transition"
                  >
                    <div>
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                        ★ {t.name}
                      </span>
                      <p className="text-slate-400 truncate max-w-xs mt-0.5">
                        {t.description || "No description"}
                      </p>
                    </div>
                    <span className="font-mono text-indigo-300">{t.id}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
