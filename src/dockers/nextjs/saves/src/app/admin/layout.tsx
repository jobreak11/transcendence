"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [adminStatus, setAdminStatus] = useState<
    "checking" | "verified" | "unauthorized"
  >("checking");

  // Verify admin access via GET /api/auth/admin/check
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/admin/check", {
          method: "GET",
        });
        if (res.ok || res.status === 204) {
          setAdminStatus("verified");
        } else {
          setAdminStatus("unauthorized");
        }
      } catch {
        setAdminStatus("unauthorized");
      }
    };
    checkAdmin();
  }, [pathname]);

  // Sign out via POST /api/auth/signout
  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  const navItems = [
    {
      name: "Overview",
      href: "/admin",
      exact: true,
      badge: "Dashboard",
    },
    {
      name: "User Management",
      href: "/admin/user_management",
      exact: false,
      badge: "/user",
    },
    {
      name: "Title Management",
      href: "/admin/title_management",
      exact: false,
      badge: "/title",
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Links */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-600/30 group-hover:bg-indigo-500 transition">
                ⚡
              </div>
              <div>
                <span className="font-bold text-white tracking-tight text-sm block leading-none">
                  SysAdmin Console
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  NestJS Core v1.0
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <span>{item.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        active
                          ? "bg-indigo-700/80 text-indigo-100"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Status & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  adminStatus === "verified"
                    ? "bg-emerald-400"
                    : adminStatus === "checking"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-slate-300 font-medium">
                {adminStatus === "verified"
                  ? "Admin Verified"
                  : adminStatus === "checking"
                  ? "Checking Auth..."
                  : "Unverified Session"}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden border-t border-slate-800/80 px-4 py-2 flex items-center gap-2 overflow-x-auto bg-slate-900/40">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200 bg-slate-900"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Page Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
