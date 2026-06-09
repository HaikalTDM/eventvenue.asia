export type Review = {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  date: string;
  text: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Venue = {
  id: string;
  title: string;
  slug: string;
  location: string;
  pricePerHour: number;
  currency: string;
  capacity: number;
  rating: number;
  reviewCount: number;
  halalVerified: boolean;
  thumbnailUrl: string;
  galleryUrls: string[];
  eventTypes: string[];
  amenities: string[];
  description: string;
  hostName: string;
  hostAvatar?: string;
  hostResponseRate: number;
  hostResponseTime: string;
  reviews: Review[];
  faqs: FAQ[];
  coordinates: Coordinates;
  address: string;
  blockedDates: string[];
};

export type InquiryStatus =
  | "pending"
  | "accepted"
  | "completed"
  | "cancelled";

export type Inquiry = {
  id: string;
  venueId: string;
  venueTitle: string;
  venueThumbnailUrl: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  eventType: string;
  specialRequirements: string;
  status: InquiryStatus;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsapp: string;
};

export type VendorType = "venue" | "service";

export type VendorUser = {
  id: string;
  name: string;
  email: string;
  vendorType: VendorType;
  businessName: string;
  phone: string;
  avatarUrl?: string;
  isVerified: boolean;
  joinedAt: string;
};

export type ServiceCategory =
  | "catering"
  | "photography"
  | "videography"
  | "decoration"
  | "dj_entertainment"
  | "makeup"
  | "planning"
  | "photobooth"
  | "ice_cream"
  | "florist"
  | "cake"
  | "transport"
  | "emcee"
  | "live_band"
  | "lighting"
  | "bridal"
  | "henna";

export type ServicePackage = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  unit: "hourly" | "per_event" | "per_package";
  includes: string[];
};

export type Service = {
  id: string;
  vendorId: string;
  title: string;
  slug: string;
  category: ServiceCategory;
  location: string;
  description: string;
  thumbnailUrl: string;
  galleryUrls: string[];
  packages: ServicePackage[];
  eventTypes: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  halalCertified: boolean;
  portfolioUrls: string[];
  availability: string;
  providerName: string;
  providerAvatar?: string;
  responseRate: number;
  responseTime: string;
  reviews: Review[];
  faqs: FAQ[];
};

export type VendorBookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type VendorAppointment = {
  id: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  eventType: string;
  guestCount: number;
  notes: string;
  status: "confirmed" | "inquiry";
};

export type BlockedDateEntry = {
  date: string;
  reason: string;
};

export type VendorBooking = {
  id: string;
  vendorId: string;
  vendorType: VendorType;
  listingId: string;
  listingTitle: string;
  listingThumbnailUrl: string;
  customerName: string;
  customerEmail: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  eventType: string;
  specialRequirements: string;
  status: VendorBookingStatus;
  totalAmount: number;
  currency: string;
  createdAt: string;
};

export type FilterState = {
  amenities: string[];
  eventTypes: string[];
  showHalalOnly: boolean;
};

export type FilterOption = {
  label: string;
  key: string;
};

export type SearchState = {
  location: string;
  eventDate: string;
  guestCapacity: number;
  halalOnly: boolean;
};

// ─── EventVenue Smart Planner Types ───

export type PlanExtraction = {
  eventType: string | null;
  guestCount: { min: number; max: number } | null;
  location: string | null;
  budget: { amount: number; currency: string } | null;
  halalRequired: boolean;
  services: ServiceCategory[];
  amenities: string[];
  preferredDate: string | null;
  duration: { startTime: string; endTime: string } | null;
  specialNotes: string;
  confidence: {
    eventType: number;
    guestCount: number;
    location: number;
    budget: number;
    overall: number;
  };
  source: "llm" | "regex";
};

export type MatchReason = {
  text: string;
  type: "positive" | "warning" | "neutral";
};

export type ScoredVenue = {
  venue: Venue;
  score: number;
  matchReasons: MatchReason[];
  estimatedCost: number;
  isBestMatch: boolean;
};

export type ScoredService = {
  service: Service;
  package: ServicePackage | null;
  score: number;
  matchReasons: MatchReason[];
  estimatedCost: number;
};

export type BudgetGap = {
  itemType: "venue" | "service";
  itemName: string;
  estimatedCost: number;
  remainingBudget: number;
};

export type PlanResponse = {
  extraction: PlanExtraction;
  plan: {
    totalEstimate: number;
    currency: string;
    budgetUtilization: number | null;
    venues: ScoredVenue[];
    serviceRecommendations: Record<string, ScoredService[]>;
    warnings: string[];
    budgetGaps: BudgetGap[];
  };
};
