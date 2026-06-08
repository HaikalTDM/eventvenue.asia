/**
 * Shared API response types.
 *
 * This file used to also export `getListings`, `createInquiry`, etc. — small
 * `fetch` wrappers around `/api/v1/*`. Phase 3 of the migration moved every
 * call site onto either:
 *
 *   - the React Query hooks under `hooks/use-*.ts` (client components), or
 *   - the server actions under `lib/actions/*.ts` (form handlers / RSC).
 *
 * The wrappers are gone; only the response types remain so downstream
 * consumers (hooks, pages) keep a single source of truth for the API shape.
 */

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
  status?: "active" | "paused" | "draft";
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
  state: string | null;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
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
  totalPrice: string | null;
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
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}
