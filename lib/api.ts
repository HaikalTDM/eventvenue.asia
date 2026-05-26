export interface ApiListing {
  id: string;
  title: string;
  slug: string;
  listingType: "venue" | "service";
  location: string | null;
  capacity: number | null;
  pricePerHour: string | null;
  currency: string;
  halalCertified: boolean;
  averageRating: string;
  reviewCount: number;
  primaryPhoto: { url: string; altText: string | null } | null;
  vendor: { businessName: string; verificationBadge: string } | null;
  amenities: string[];
  eventTypes: string[];
  createdAt: string;
}

export interface ApiListingDetail {
  id: string;
  title: string;
  slug: string;
  listingType: "venue" | "service";
  description: string | null;
  location: string | null;
  address: string | null;
  capacity: number | null;
  pricePerHour: string | null;
  currency: string;
  halalCertified: boolean;
  status: string;
  averageRating: string;
  reviewCount: number;
  photos: Array<{ url: string; altText: string | null; sortOrder: number; isPrimary: boolean }>;
  amenities: Array<{ id: number; name: string; icon: string | null; category: string | null }>;
  eventTypes: Array<{ id: number; name: string }>;
  servicePackages: Array<{ id: string; name: string; description: string | null; price: string; currency?: string }>;
  vendor: {
    id: string;
    businessName: string;
    businessDescription: string | null;
    businessWebsite: string | null;
    verificationBadge: string;
    joinDate: string;
  } | null;
  availability: {
    blockedDates: string[];
    appointments: Array<{ startTime: string; endTime: string; label: string | null; source: string | null }>;
  };
  reviews: Array<{
    id: string;
    customer: { name: string; avatarUrl: string | null };
    rating: number;
    comment: string | null;
    createdAt: string;
  }>;
  isFavorited?: boolean;
  createdAt: string;
}

export interface ApiFilter {
  id: number;
  name: string;
  count: number;
}

export interface ApiListingsResponse {
  data: ApiListing[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  filters: { amenities: ApiFilter[]; eventTypes: ApiFilter[] };
}

export interface ApiDetailResponse {
  data: ApiListingDetail;
}

export interface ApiInquiry {
  id: string;
  listingId: string;
  customerId: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  eventType: string | null;
  specialRequirements: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  listing?: {
    id: string;
    title: string;
    slug: string;
    location: string | null;
    primaryPhoto: { url: string } | null;
  };
}

const BASE = "/api/v1";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function getListings(params: Record<string, string> = {}): Promise<ApiListingsResponse> {
  const qs = new URLSearchParams(params).toString();
  return fetchJSON<ApiListingsResponse>(`${BASE}/listings${qs ? `?${qs}` : ""}`);
}

export async function getListingDetail(id: string): Promise<ApiDetailResponse> {
  return fetchJSON<ApiDetailResponse>(`${BASE}/listings/${id}`);
}

export async function createInquiry(body: {
  listingId: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  eventType?: string;
  specialRequirements?: string;
}): Promise<{ data: unknown }> {
  return fetchJSON(`${BASE}/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getMyInquiries(): Promise<{ data: ApiInquiry[] }> {
  return fetchJSON(`${BASE}/inquiries`);
}

export async function getVendorInquiries(): Promise<{ data: ApiInquiry[] }> {
  return fetchJSON(`${BASE}/inquiries/vendor`);
}

export async function updateInquiryStatus(inquiryId: string, status: string): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/inquiries/${inquiryId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function getFavorites(): Promise<{ data: Array<{ id: string; title: string; slug: string; location: string | null }> }> {
  return fetchJSON(`${BASE}/favorites`);
}

export async function addFavorite(listingId: string): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
}

export async function removeFavorite(listingId: string): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/favorites?listingId=${listingId}`, { method: "DELETE" });
}

export async function checkFavorite(listingId: string): Promise<{ isFavorited: boolean }> {
  return fetchJSON(`${BASE}/favorites/check/${listingId}`);
}

export async function getVendorBookings(): Promise<{ data: unknown[] }> {
  return fetchJSON(`${BASE}/bookings/vendor`);
}

export async function getVendorProfile(): Promise<unknown> {
  return fetchJSON(`${BASE}/vendors/me`);
}

export async function updateVendorProfile(body: Record<string, unknown>): Promise<unknown> {
  return fetchJSON(`${BASE}/vendors/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
