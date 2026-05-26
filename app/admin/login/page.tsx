"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (email === "admin@eventvenue.asia" && password === "admin123") {
        localStorage.setItem("ev_admin_auth", JSON.stringify({ email, role: "admin" }));
        router.push("/admin/dashboard");
      } else {
        setError("Invalid credentials. Use the demo account below.");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EB4D4B] text-sm font-bold text-white">EV</span>
            EventVenue<span className="text-[#EB4D4B]">.Asia</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">Admin Portal</h1>
          <p className="mt-2 text-sm text-gray-400">Platform management and oversight</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-gray-700 bg-gray-800 p-6">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@eventvenue.asia"
              className="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Demo Account</p>
          <button
            onClick={() => { setEmail("admin@eventvenue.asia"); setPassword("admin123"); }}
            className="mt-3 flex w-full items-center justify-between rounded-xl border border-gray-600 px-4 py-2.5 text-left transition-colors hover:bg-gray-700"
          >
            <div>
              <p className="text-sm font-semibold text-white">Platform Admin</p>
              <p className="text-xs text-gray-400">admin@eventvenue.asia</p>
            </div>
            <span className="rounded-full bg-[#EB4D4B]/20 px-2.5 py-0.5 text-xs font-medium text-[#EB4D4B]">Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
