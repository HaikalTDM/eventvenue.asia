"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

/**
 * React Query hooks for the admin panel. Each admin surface (dashboard
 * stats, users, vendors, moderation, documents, analytics) gets its own
 * query so the cache stays granular — invalidating one queue's mutation
 * doesn't refetch unrelated data.
 *
 * Auth gating happens at the route handler. Anonymous or non-admin
 * callers receive a 403, which surfaces as an error from the hook;
 * the admin layout already gates the entire `/admin` subtree behind a
 * role check, so the hook errors here are belt-and-braces.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type DashboardStats = {
  users: number;
  vendors: number;
  listings: number;
  pendingVendors: number;
  bookings: number;
};

export type ApiAdminUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "vendor" | "admin";
  phone: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  isMock: boolean;
  authProvider: string;
  createdAt: string;
  updatedAt: string;
};

export type VendorStatus = "pending" | "approved" | "rejected";
export type VendorType = "venue_owner" | "service_provider";

export type ApiAdminVendor = {
  id: string;
  vendorType: VendorType;
  businessName: string;
  businessLocation: string | null;
  verificationStatus: VendorStatus;
  verificationBadge: string;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
};

export type FlagStatus = "pending" | "resolved";

export type ApiFlag = {
  id: string;
  type: "review" | "listing" | "message";
  targetId: string;
  targetTitle: string | null;
  targetPreview: string;
  flagReason: string;
  status: FlagStatus;
  flaggedBy: { id: string | null; name: string; email: string | null };
  createdAt: string;
  resolvedAt: string | null;
};

export type DocumentStatus = "pending" | "approved" | "rejected";

export type ApiDocument = {
  id: string;
  docType: string;
  fileUrl: string;
  status: DocumentStatus;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  vendor: {
    id: string;
    businessName: string;
    ownerName: string | null;
    ownerEmail: string | null;
  } | null;
};

// ─── Query keys ─────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminKeys.all, "dashboard"] as const,
  users: (params: { search?: string; includeMock?: boolean; limit?: number }) =>
    [...adminKeys.all, "users", params] as const,
  vendors: (params: { status?: VendorStatus | "all"; includeMock?: boolean }) =>
    [...adminKeys.all, "vendors", params] as const,
  flags: (status: "pending" | "resolved" | "all") =>
    [...adminKeys.all, "flags", status] as const,
  documents: (status: "pending" | "approved" | "rejected" | "all") =>
    [...adminKeys.all, "documents", status] as const,
  analytics: () => [...adminKeys.all, "analytics"] as const,
};

// ─── Fetchers ───────────────────────────────────────────────────────────────

async function fetchDashboard(): Promise<DashboardStats> {
  const res = await fetch("/api/v1/admin/dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error(`admin_dashboard_failed: ${res.status}`);
  const body = (await res.json()) as { data: DashboardStats };
  return body.data;
}

async function fetchUsers(params: {
  search?: string;
  includeMock?: boolean;
  limit?: number;
}): Promise<ApiAdminUser[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.includeMock) qs.set("includeMock", "true");
  qs.set("limit", String(params.limit ?? 100));
  const res = await fetch(`/api/v1/admin/users?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`admin_users_failed: ${res.status}`);
  const body = (await res.json()) as { data: ApiAdminUser[] };
  return body.data;
}

async function fetchVendors(params: {
  status?: VendorStatus | "all";
  includeMock?: boolean;
}): Promise<ApiAdminVendor[]> {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.includeMock) qs.set("includeMock", "true");
  const res = await fetch(
    `/api/v1/admin/vendors${qs.toString() ? `?${qs.toString()}` : ""}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`admin_vendors_failed: ${res.status}`);
  const body = (await res.json()) as { data: ApiAdminVendor[] };
  return body.data;
}

async function fetchFlags(status: "pending" | "resolved" | "all"): Promise<ApiFlag[]> {
  const res = await fetch(`/api/v1/admin/moderation?status=${status}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`admin_flags_failed: ${res.status}`);
  const body = (await res.json()) as { data: ApiFlag[] };
  return body.data;
}

async function fetchDocuments(
  status: "pending" | "approved" | "rejected" | "all"
): Promise<ApiDocument[]> {
  const res = await fetch(`/api/v1/admin/documents?status=${status}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`admin_documents_failed: ${res.status}`);
  const body = (await res.json()) as { data: ApiDocument[] };
  return body.data;
}

async function fetchAnalytics(): Promise<unknown> {
  const res = await fetch("/api/v1/admin/analytics", { cache: "no-store" });
  if (!res.ok) throw new Error(`admin_analytics_failed: ${res.status}`);
  const body = (await res.json()) as { data: unknown };
  return body.data;
}

// ─── Read hooks ─────────────────────────────────────────────────────────────

export function useAdminDashboard(
  options?: Omit<
    UseQueryOptions<DashboardStats, Error, DashboardStats, ReturnType<typeof adminKeys.dashboard>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: fetchDashboard,
    ...options,
  });
}

export function useAdminUsers(
  params: { search?: string; includeMock?: boolean; limit?: number } = {},
  options?: Omit<
    UseQueryOptions<ApiAdminUser[], Error, ApiAdminUser[], ReturnType<typeof adminKeys.users>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => fetchUsers(params),
    ...options,
  });
}

export function useAdminVendors(
  params: { status?: VendorStatus | "all"; includeMock?: boolean } = {},
  options?: Omit<
    UseQueryOptions<ApiAdminVendor[], Error, ApiAdminVendor[], ReturnType<typeof adminKeys.vendors>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: adminKeys.vendors(params),
    queryFn: () => fetchVendors(params),
    ...options,
  });
}

export function useAdminFlags(
  status: "pending" | "resolved" | "all" = "pending",
  options?: Omit<
    UseQueryOptions<ApiFlag[], Error, ApiFlag[], ReturnType<typeof adminKeys.flags>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: adminKeys.flags(status),
    queryFn: () => fetchFlags(status),
    ...options,
  });
}

export function useAdminDocuments(
  status: "pending" | "approved" | "rejected" | "all" = "pending",
  options?: Omit<
    UseQueryOptions<ApiDocument[], Error, ApiDocument[], ReturnType<typeof adminKeys.documents>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: adminKeys.documents(status),
    queryFn: () => fetchDocuments(status),
    ...options,
  });
}

export function useAdminAnalytics(
  options?: Omit<
    UseQueryOptions<unknown, Error, unknown, ReturnType<typeof adminKeys.analytics>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: adminKeys.analytics(),
    queryFn: fetchAnalytics,
    ...options,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Suspend or reactivate a user. Used by the admin users page; cannot
 * suspend admins (the route handler enforces this in spirit but the UI
 * gate is here too).
 */
export function useToggleUserSuspension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      action,
    }: {
      userId: string;
      action: "suspend" | "reactivate";
    }): Promise<void> => {
      const res = await fetch(
        `/api/v1/admin/users?userId=${userId}&action=${action}`,
        { method: "PUT" }
      );
      if (!res.ok) throw new Error(`toggle_suspend_failed: ${res.status}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/**
 * Approve or reject a vendor application. Approve flips the verified
 * badge and lifts any suspension on the underlying user; reject suspends
 * the user with the supplied reason.
 */
export function useVendorVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      vendorId,
      action,
      reason,
    }: {
      vendorId: string;
      action: "approve" | "reject";
      reason?: string;
    }): Promise<void> => {
      const res = await fetch(
        `/api/v1/admin/vendors?vendorId=${vendorId}&action=${action}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: reason ? JSON.stringify({ reason }) : undefined,
        }
      );
      if (!res.ok) throw new Error(`vendor_verification_failed: ${res.status}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/**
 * Resolve or dismiss a content flag. "resolve" takes action against
 * the flagged target (clear review comment, pause listing, hide message);
 * "dismiss" leaves the target as-is.
 */
export function useResolveFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      flagId,
      action,
    }: {
      flagId: string;
      action: "resolve" | "dismiss";
    }): Promise<void> => {
      const res = await fetch(
        `/api/v1/admin/moderation?flagId=${flagId}&action=${action}`,
        { method: "PUT" }
      );
      if (!res.ok) throw new Error(`resolve_flag_failed: ${res.status}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.flags("pending") });
      qc.invalidateQueries({ queryKey: adminKeys.flags("all") });
    },
  });
}

/**
 * Approve or reject a vendor verification document. Reject accepts an
 * optional reason that gets stored on the document row.
 */
export function useReviewDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      docId,
      action,
      reason,
    }: {
      docId: string;
      action: "approve" | "reject";
      reason?: string;
    }): Promise<void> => {
      const res = await fetch(
        `/api/v1/admin/documents?docId=${docId}&action=${action}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: reason ? JSON.stringify({ reason }) : undefined,
        }
      );
      if (!res.ok) throw new Error(`review_document_failed: ${res.status}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
