"use client";

import { VendorAuthProvider } from "@/lib/vendor-auth";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VendorAuthProvider>{children}</VendorAuthProvider>;
}
