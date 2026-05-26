"use client";

import { useVendorAuth } from "@/lib/vendor-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VendorRootPage() {
  const { isAuthenticated, isLoading } = useVendorAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? "/vendor/dashboard" : "/vendor/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EB4D4B]" />
    </div>
  );
}
