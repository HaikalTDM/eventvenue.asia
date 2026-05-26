"use client";

import { useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "vendor";
  vendorType?: "venue" | "service";
  status: "active" | "suspended";
  joinedAt: string;
  lastActive: string;
};

const mockUsers: User[] = [
  { id: "u-1", name: "Sarah Ahmad", email: "sarah@gmail.com", role: "customer", status: "active", joinedAt: "Jan 2025", lastActive: "Today" },
  { id: "u-2", name: "Ahmad Razak", email: "ahmad.razak@company.com", role: "customer", status: "active", joinedAt: "Dec 2024", lastActive: "Yesterday" },
  { id: "u-3", name: "Nurul Izzah", email: "nurul@hotmail.com", role: "customer", status: "active", joinedAt: "Nov 2024", lastActive: "3 days ago" },
  { id: "u-4", name: "Aisha Rahman", email: "aisha@majestic-kl.com", role: "vendor", vendorType: "venue", status: "active", joinedAt: "Oct 2024", lastActive: "Today" },
  { id: "u-5", name: "Hassan Catering", email: "info@hassancatering.my", role: "vendor", vendorType: "service", status: "active", joinedAt: "Sep 2024", lastActive: "Today" },
  { id: "u-6", name: "Lisa Photography", email: "lisa@lisaphoto.com", role: "vendor", vendorType: "service", status: "active", joinedAt: "Aug 2024", lastActive: "2 days ago" },
  { id: "u-7", name: "Farid Abdullah", email: "farid@skyline-lounge.com", role: "vendor", vendorType: "venue", status: "active", joinedAt: "Jul 2024", lastActive: "1 week ago" },
  { id: "u-8", name: "Tan Wei Ming", email: "weiming@gmail.com", role: "customer", status: "suspended", joinedAt: "Jun 2024", lastActive: "2 weeks ago" },
  { id: "u-9", name: "DJ Rizal", email: "rizal@djrizal.com", role: "vendor", vendorType: "service", status: "active", joinedAt: "May 2024", lastActive: "4 days ago" },
  { id: "u-10", name: "Siti Aminah", email: "siti.aminah@yahoo.com", role: "customer", status: "active", joinedAt: "Apr 2024", lastActive: "Today" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [filter, setFilter] = useState<"all" | "customer" | "vendor" | "suspended">("all");
  const [search, setSearch] = useState("");

  const toggleSuspend = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => u.id === id ? { ...u, status: (u.status === "active" ? "suspended" : "active") as "active" | "suspended" } : u)
    );
  };

  const filtered = users.filter((u) => {
    if (filter === "suspended") return u.status === "suspended";
    if (filter === "customer") return u.role === "customer";
    if (filter === "vendor") return u.role === "vendor";
    return true;
  }).filter((u) =>
    search ? u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="mt-1 text-sm text-gray-400">{users.length} total users</p>
      </div>

      {/* Search & Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["all", "customer", "vendor", "suspended"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${filter === f ? "bg-[#EB4D4B] text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
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

      {/* Users Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">User</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">Role</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">Joined</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">Last Active</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === "vendor" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {user.role === "vendor" ? (user.vendorType === "venue" ? "Venue Owner" : "Service Provider") : "Customer"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.status === "active" ? "text-green-400" : "text-red-400"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.status === "active" ? "bg-green-400" : "bg-red-400"}`} />
                    {user.status === "active" ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-400">{user.joinedAt}</td>
                <td className="px-5 py-3 text-xs text-gray-400">{user.lastActive}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => toggleSuspend(user.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      user.status === "active"
                        ? "border border-red-600 text-red-400 hover:bg-red-600/10"
                        : "border border-green-600 text-green-400 hover:bg-green-600/10"
                    }`}
                  >
                    {user.status === "active" ? "Suspend" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
