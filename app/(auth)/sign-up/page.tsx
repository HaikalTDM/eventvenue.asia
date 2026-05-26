"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

type UserRole = "customer" | "vendor";

const GOOGLE_OAUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

export default function SignUpPage() {
  const [role, setRole] = useState<UserRole>("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { signUp } = useAuth();
  const router = useRouter();

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordMismatch || !agreedToTerms) return;
    setLoading(true);
    const success = await signUp(fullName, email, password, phone);
    setLoading(false);
    if (!success) {
      setNotice("Could not create account. The email may already be in use.");
      return;
    }
    router.push("/");
  };

  const handleGoogle = () => {
    if (GOOGLE_OAUTH_ENABLED) {
      window.location.href = "/api/v1/auth/google/start";
      return;
    }
    setNotice("Google sign-up is not yet available. Please use email.");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EB4D4B] text-sm font-bold text-white">
            EV
          </span>
          EventVenue<span className="text-[#EB4D4B]">.Asia</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-2 text-sm text-gray-500">
          Join the largest event venue marketplace in Southeast Asia
        </p>
      </div>

      {/* Role Toggle */}
      <div className="rounded-xl border border-gray-200 bg-white p-1.5">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              role === "customer"
                ? "bg-[#EB4D4B] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            I&apos;m planning an event
          </button>
          <button
            type="button"
            onClick={() => setRole("vendor")}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              role === "vendor"
                ? "bg-[#EB4D4B] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            I&apos;m a vendor
          </button>
        </div>
      </div>

      {/* Vendor Redirect */}
      {role === "vendor" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg className="h-7 w-7 text-[#EB4D4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Join as a Vendor
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Whether you own an event venue or provide services like catering, photography, DJ, decoration, or event planning — register as a vendor to reach thousands of customers.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Venue Owners</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Catering</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Photography</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">DJ &amp; Entertainment</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Decoration</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Event Planning</span>
          </div>
          <Link
            href="/vendor/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626]"
          >
            Continue to Vendor Registration
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="mt-4 text-xs text-gray-400">
            Quick multi-step registration with business details and document verification.
          </p>
        </div>
      )}

      {/* Customer Registration Flow */}
      {role === "customer" && (
        <>
      {/* Social Login */}
      <div>
        <button
          type="button"
          onClick={handleGoogle}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </div>

      {notice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {notice}
        </div>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-50 px-4 text-gray-400">or register with email</span>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
              +60
            </span>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="12 345 6789"
              className="w-full rounded-r-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.267-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-[#EB4D4B]/20 ${
              passwordMismatch
                ? "border-red-400 focus:border-red-400"
                : "border-gray-200 focus:border-[#EB4D4B]"
            }`}
          />
          {passwordMismatch && (
            <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
          )}
        </div>

        {/* Terms */}
        <label className="inline-flex items-start gap-3">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#EB4D4B]"
          />
          <span className="text-sm text-gray-600">
            I agree to the{" "}
            <Link href="#" className="font-medium text-[#EB4D4B] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="font-medium text-[#EB4D4B] hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !agreedToTerms || passwordMismatch}
          className="w-full rounded-xl bg-[#EB4D4B] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
        </>
      )}

      {/* Sign In Link */}
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-[#EB4D4B] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
