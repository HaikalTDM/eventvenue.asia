"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import StickyNav from "@/components/StickyNav";
import Footer from "@/components/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect only after session loading completes. Do NOT short-circuit on
  // a legacy localStorage flag - live-mode customers don't write that
  // flag and were being bounced to /sign-in even with a valid JWT.
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/sign-in");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EB4D4B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyNav />
      <main className="container-custom py-8 lg:py-12">{children}</main>
      <Footer />
    </div>
  );
}
