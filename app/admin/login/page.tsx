"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/provider";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { signInWithPassword, signOut } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPassword(email, password);
      if (!result.ok) {
        setError(result.error || "Invalid email or password.");
        return;
      }

      // Reject any non-admin account immediately and revoke the session we
      // just created so they don't hold a valid cookie they didn't intend to
      // get. Without this, a customer/vendor who tries the admin login form
      // would silently end up signed in as their own role.
      if (result.user?.role !== "admin") {
        await signOut();
        setError("This account is not an admin. Use the customer or vendor sign-in pages.");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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
              placeholder="admin@example.com"
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

        <p className="mt-6 text-center text-xs text-gray-500">
          Admin accounts are created via CLI: <code className="rounded bg-gray-800 px-1.5 py-0.5 font-mono">npm run create:admin</code>
        </p>
      </div>
    </div>
  );
}
