"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useVendorAuth } from "@/lib/vendor-auth";
import Image from "next/image";

const navItems = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l7 7-7 7m5-5v10a1 1 0 01-1 1h-3m-6 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { href: "/vendor/listings", label: "Listings", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { href: "/vendor/inquiries", label: "Inquiries", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { href: "/vendor/bookings", label: "Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { href: "/vendor/calendar", label: "Calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/vendor/analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/vendor/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

export default function VendorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { vendor, logout, isLoading } = useVendorAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to login only after the session has finished loading and we
  // know there is no vendor. Don't gate on a legacy localStorage key.
  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [vendor, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push("/vendor/login");
  };

  if (isLoading || !vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EB4D4B]" />
      </div>
    );
  }

  const isVenue = vendor.vendorType === "venue" || vendor.vendorType === "venue_owner";
  const typeLabel = isVenue ? "Venue Owner" : "Service Provider";
  const typeBadgeColor = isVenue ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="border-b border-gray-100 p-5">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#EB4D4B] text-xs font-bold text-white">EV</span>
              Vendor Portal
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-[#EB4D4B]/10 text-[#EB4D4B]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} /></svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center gap-3">
              {vendor.avatarUrl ? (
                <Image src={vendor.avatarUrl} alt={vendor.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EB4D4B] text-xs font-bold text-white">{vendor.name.split(" ").map(n => n[0]).join("")}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{vendor.name}</p>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeBadgeColor}`}>{typeLabel}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="mt-3 flex w-full items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <div className="border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <Link href="/vendor/dashboard" className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#EB4D4B] text-xs font-bold text-white">EV</span>
            Vendor Portal
          </Link>
        </div>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
