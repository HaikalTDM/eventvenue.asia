"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { usePageVisibility, type PageKey } from "@/lib/page-visibility";

const navLinks = [
  { href: "/#venues", label: "Browse Venues", match: null, pageKey: "browse_venues" as PageKey },
  { href: "/#how-it-works", label: "How it Works", match: null, pageKey: "how_it_works" as PageKey },
  { href: "/compare", label: "Compare", match: "/compare", pageKey: "compare" as PageKey },
];

const dashboardLinks = [
  { href: "/dashboard", label: "Dashboard", match: "/dashboard", pageKey: "inquiries" as PageKey },
  { href: "/dashboard/inquiries", label: "My Inquiries", match: "/dashboard/inquiries", pageKey: "inquiries" as PageKey },
  { href: "/dashboard/favorites", label: "Favorites", match: "/dashboard/favorites", pageKey: "favorites" as PageKey },
];

function NavLink({
  href,
  label,
  isActive,
  isAccent,
}: {
  href: string;
  label: string;
  isActive: boolean;
  isAccent: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative text-sm font-medium transition-colors ${
        isActive
          ? isAccent
            ? "text-[#EB4D4B]"
            : "text-gray-900"
          : isAccent
          ? "text-[#EB4D4B] hover:text-[#dc2626]"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {label}
      <span
        className={`absolute -bottom-1 left-0 h-0.5 bg-[#EB4D4B] transition-all duration-300 ${
          isActive ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  isActive,
  isAccent,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  isAccent: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? isAccent
            ? "bg-red-50 font-semibold text-[#EB4D4B]"
            : "bg-gray-100 font-semibold text-gray-900"
          : isAccent
          ? "text-[#EB4D4B] hover:bg-red-50"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {label}
    </Link>
  );
}

export default function StickyNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAnimating, setMobileAnimating] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);
  const dashRef = useRef<HTMLDivElement>(null);
  const { user, signOut, isLoading } = useAuth();
  const { isPageVisible } = usePageVisibility();
  const pathname = usePathname();

  const visibleNavLinks = navLinks.filter((link) => isPageVisible(link.pageKey));
  const visibleDashLinks = dashboardLinks.filter((link) => isPageVisible(link.pageKey));
  const isDashboardActive = visibleDashLinks.some((link) => {
    if (link.match === "/dashboard/inquiries") return pathname.startsWith("/dashboard/inquiries");
    if (link.match === "/dashboard/favorites") return pathname.startsWith("/dashboard/favorites");
    if (link.match === "/dashboard") return pathname === "/dashboard";
    return false;
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dashRef.current && !dashRef.current.contains(e.target as Node)) {
        setDashOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (match: string | null) => {
    if (match === null) return false;
    if (match === "/") return pathname === "/";
    return pathname.startsWith(match);
  };

  const isAccent = (label: string) =>
    label === "My Inquiries" || label === "Favorites";

  const handleMobileToggle = () => {
    if (mobileAnimating) return;
    setMobileAnimating(true);
    setMobileMenuOpen(!mobileMenuOpen);
    setTimeout(() => setMobileAnimating(false), 300);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md"
          : "bg-white"
      }`}
    >
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between lg:h-20">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EB4D4B] text-sm font-bold text-white">
              EV
            </span>
            <span>
              EventVenue<span className="text-[#EB4D4B]">.Asia</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {visibleNavLinks.map((link) => (
              <NavLink
                key={link.href + link.label}
                href={link.href}
                label={link.label}
                isActive={isActive(link.match)}
                isAccent={isAccent(link.label)}
              />
            ))}

            {/* Dashboard Dropdown (Desktop) */}
            {user && visibleDashLinks.length > 0 && (
              <div className="relative" ref={dashRef}>
                <button
                  onClick={() => setDashOpen(!dashOpen)}
                  className={`group relative flex items-center gap-1 text-sm font-medium transition-colors ${
                    isDashboardActive ? "text-[#EB4D4B]" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Dashboard
                  <svg
                    className={`h-4 w-4 transition-transform ${dashOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-[#EB4D4B] transition-all duration-300 ${
                      isDashboardActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </button>
                {dashOpen && (
                  <div className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                    {visibleDashLinks.map((link) => (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        onClick={() => setDashOpen(false)}
                        className={`block px-4 py-2.5 text-sm transition-colors ${
                          isActive(link.match)
                            ? "bg-red-50 font-semibold text-[#EB4D4B]"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <NavLink
              key="/dashboard/settings"
              href="/dashboard/settings"
              label="Settings"
              isActive={isActive("/dashboard/settings")}
              isAccent={false}
            />
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {isLoading ? null : user ? (
              <>
                <span className="text-sm font-medium text-gray-600">
                  {user.name}
                </span>
                <button
                  onClick={signOut}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-[#EB4D4B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#dc2626]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="block rounded-lg p-2 text-gray-600 lg:hidden"
            onClick={handleMobileToggle}
            aria-label="Toggle menu"
          >
            <svg
              className={`h-6 w-6 transition-transform duration-300 ${mobileMenuOpen ? "rotate-90" : "rotate-0"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu with Smooth Animation */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-gray-100 py-4">
            <nav className="flex flex-col gap-1">
              {visibleNavLinks.map((link) => (
                <MobileNavLink
                  key={link.href + link.label}
                  href={link.href}
                  label={link.label}
                  isActive={isActive(link.match)}
                  isAccent={isAccent(link.label)}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
              {user && visibleDashLinks.map((link) => (
                <MobileNavLink
                  key={link.href + link.label}
                  href={link.href}
                  label={link.label}
                  isActive={isActive(link.match)}
                  isAccent={isAccent(link.label)}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
              <MobileNavLink
                key="settings"
                href="/dashboard/settings"
                label="Settings"
                isActive={isActive("/dashboard/settings")}
                isAccent={false}
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="mt-2 flex gap-2 px-3">
                {isLoading ? null : user ? (
                  <>
                    <span className="flex items-center text-sm font-medium text-gray-600">
                      {user.name}
                    </span>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="flex-1 rounded-lg bg-[#EB4D4B] px-4 py-2 text-center text-sm font-semibold text-white"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
