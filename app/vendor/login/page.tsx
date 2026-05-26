"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVendorAuth } from "@/lib/vendor-auth";

export default function VendorLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useVendorAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      router.push("/vendor/dashboard");
    } else {
      setError("Invalid credentials. Try one of the demo accounts below.");
    }
  };

  const demoAccounts = [
    { email: "aisha@majestic-kl.com", type: "Venue", name: "Aisha Rahman" },
    { email: "info@hassancatering.my", type: "Service (Catering)", name: "Hassan Catering" },
    { email: "lisa@lisaphoto.com", type: "Service (Photography)", name: "Lisa Creative" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EB4D4B] text-sm font-bold text-white">EV</span>
            EventVenue<span className="text-[#EB4D4B]">.Asia</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Vendor Portal</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to manage your listings and bookings</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? "" : "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.267-2.943-9.542-7z"} /></svg>
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Demo Accounts</p>
          <div className="mt-3 space-y-2">
            {demoAccounts.map((acc) => (
              <button key={acc.email} onClick={() => { setEmail(acc.email); setPassword("demo"); }} className="flex w-full items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-left transition-colors hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{acc.name}</p>
                  <p className="text-xs text-gray-400">{acc.email}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{acc.type}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have a vendor account?{" "}
          <Link href="/vendor/register" className="font-medium text-[#EB4D4B] hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
