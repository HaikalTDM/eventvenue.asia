"use client";

import { useState } from "react";

import {
  useAdminUsers,
  useToggleUserSuspension,
  type ApiAdminUser,
} from "@/hooks/use-admin";

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<"all" | "customer" | "vendor" | "admin" | "suspended">("all");
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading: loading, error } = useAdminUsers({ limit: 100 });
  const toggleSuspension = useToggleUserSuspension();
  const errorMessage = error?.message ?? null;

  const toggleSuspend = (u: ApiAdminUser) => {
    toggleSuspension.mutate({
      userId: u.id,
      action: u.isSuspended ? "reactivate" : "suspend",
    });
  };

  const actionInFlight =
    toggleSuspension.isPending ? toggleSuspension.variables?.userId ?? null : null;

  const filtered = users
    .filter((u) => {
      if (filter === "suspended") return u.isSuspended;
      if (filter === "customer") return u.role === "customer";
      if (filter === "vendor") return u.role === "vendor";
      if (filter === "admin") return u.role === "admin";
      return true;
    })
    .filter((u) =>
      search
        ? u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
        : true
    );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="mt-1 text-sm text-gray-400">{users.length} total users</p>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["all", "customer", "vendor", "admin", "suspended"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                filter === f
                  ? "bg-[#EB4D4B] text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full sm:w-64 rounded-xl border border-gray-600 bg-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-400 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No users match this filter.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">Joined</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {u.name}
                        {u.isMock && (
                          <span className="ml-2 rounded bg-gray-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                            seed
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-red-500/10 text-red-400"
                          : u.role === "vendor"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        u.isSuspended ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          u.isSuspended ? "bg-red-400" : "bg-green-400"
                        }`}
                      />
                      {u.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{formatJoined(u.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    {u.role === "admin" ? (
                      <span className="text-xs text-gray-500">—</span>
                    ) : (
                      <button
                        onClick={() => toggleSuspend(u)}
                        disabled={actionInFlight === u.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                          !u.isSuspended
                            ? "border border-red-600 text-red-400 hover:bg-red-600/10"
                            : "border border-green-600 text-green-400 hover:bg-green-600/10"
                        }`}
                      >
                        {actionInFlight === u.id
                          ? "..."
                          : u.isSuspended
                          ? "Reactivate"
                          : "Suspend"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
