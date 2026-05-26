import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  date,
  time,
  timestamp,
  smallint,
  jsonb,
  uniqueIndex,
  index,
  check,
  pgEnum,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["customer", "vendor", "admin"]);
export const authProviderEnum = pgEnum("auth_provider", ["credentials", "google", "apple"]);
export const vendorTypeEnum = pgEnum("vendor_type", ["venue_owner", "service_provider"]);
export const vendorVerificationStatusEnum = pgEnum("vendor_verification_status", ["pending", "approved", "rejected"]);
export const verificationBadgeEnum = pgEnum("verification_badge", ["none", "verified", "premium"]);
export const listingTypeEnum = pgEnum("listing_type", ["venue", "service"]);
export const listingStatusEnum = pgEnum("listing_status", ["active", "paused", "draft"]);
export const inquiryStatusEnum = pgEnum("inquiry_status", ["pending", "accepted", "approved", "proceed", "ongoing", "completed", "cancelled"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "in_progress", "completed", "cancelled"]);
export const conversationTypeEnum = pgEnum("conversation_type", ["direct", "group"]);
export const planStatusEnum = pgEnum("plan_status", ["processing", "completed", "failed"]);
export const recommendationTypeEnum = pgEnum("recommendation_type", ["venue", "service"]);
export const documentTypeEnum = pgEnum("document_type", ["business_license", "halal_cert", "identity", "other"]);
export const documentStatusEnum = pgEnum("document_status", ["pending", "approved", "rejected"]);
export const flagTargetTypeEnum = pgEnum("flag_target_type", ["review", "listing", "message"]);
export const flagStatusEnum = pgEnum("flag_status", ["pending", "resolved"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("customer"),
  authProvider: authProviderEnum("auth_provider").notNull().default("credentials"),
  isVerified: boolean("is_verified").notNull().default(false),
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspendedReason: text("suspended_reason"),
  isMock: boolean("is_mock").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_users_email").on(table.email),
]);

export const vendorProfiles = pgTable("vendor_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  vendorType: vendorTypeEnum("vendor_type").notNull(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  businessDescription: text("business_description"),
  businessWebsite: varchar("business_website", { length: 255 }),
  businessLocation: varchar("business_location", { length: 255 }),
  serviceCategory: varchar("service_category", { length: 100 }),
  verificationStatus: vendorVerificationStatusEnum("verification_status").notNull().default("pending"),
  verificationBadge: verificationBadgeEnum("verification_badge").notNull().default("none"),
  isMock: boolean("is_mock").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_vendor_profiles_user_id").on(table.userId),
  index("idx_vendor_profiles_verification_status").on(table.verificationStatus),
]);

export const vendorDocuments = pgTable("vendor_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendorProfiles.id, { onDelete: "cascade" }),
  docType: documentTypeEnum("doc_type").notNull(),
  fileUrl: text("file_url").notNull(),
  status: documentStatusEnum("status").notNull().default("pending"),
  rejectReason: text("reject_reason"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
}, (table) => [
  index("idx_vendor_documents_vendor_id").on(table.vendorId),
  index("idx_vendor_documents_status").on(table.status),
]);

export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendorProfiles.id, { onDelete: "cascade" }),
  listingType: listingTypeEnum("listing_type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  coordinates: text("coordinates"),
  address: text("address"),
  capacity: integer("capacity"),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("MYR"),
  halalCertified: boolean("halal_certified").notNull().default(false),
  status: listingStatusEnum("status").notNull().default("draft"),
  isVerified: boolean("is_verified").notNull().default(false),
  averageRating: decimal("average_rating", { precision: 2, scale: 1 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  isMock: boolean("is_mock").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_listings_vendor_id").on(table.vendorId),
  index("idx_listings_listing_type").on(table.listingType),
  index("idx_listings_status").on(table.status),
  index("idx_listings_location").on(table.location),
  index("idx_listings_capacity").on(table.capacity),
  index("idx_listings_price").on(table.pricePerHour),
  index("idx_listings_halal").on(table.halalCertified),
  index("idx_listings_slug").on(table.slug),
  index("idx_listings_average_rating_desc").on(table.averageRating),
]);

export const listingPhotos = pgTable("listing_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: varchar("alt_text", { length: 255 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_listing_photos_listing_id").on(table.listingId),
]);

export const amenities = pgTable("amenities", {
  id: smallint("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }),
  category: varchar("category", { length: 50 }),
});

export const listingAmenities = pgTable("listing_amenities", {
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  amenityId: smallint("amenity_id").notNull().references(() => amenities.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.listingId, table.amenityId] }),
  index("idx_listing_amenities_listing_id").on(table.listingId),
  index("idx_listing_amenities_amenity_id").on(table.amenityId),
]);

export const eventTypes = pgTable("event_types", {
  id: smallint("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const listingEventTypes = pgTable("listing_event_types", {
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  eventTypeId: smallint("event_type_id").notNull().references(() => eventTypes.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.listingId, table.eventTypeId] }),
  index("idx_listing_event_types_listing_id").on(table.listingId),
  index("idx_listing_event_types_event_type_id").on(table.eventTypeId),
]);

export const servicePackages = pgTable("service_packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_service_packages_listing_id").on(table.listingId),
]);

export const serviceTags = pgTable("service_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  tag: varchar("tag", { length: 100 }).notNull(),
}, (table) => [
  index("idx_service_tags_listing_id").on(table.listingId),
]);

export const availabilityBlocks = pgTable("availability_blocks", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  isBlocked: boolean("is_blocked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_availability_blocks_listing_date").on(table.listingId, table.date),
  uniqueIndex("idx_availability_blocks_unique").on(table.listingId, table.date),
]);

export const availabilitySlots = pgTable("availability_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  blockId: uuid("block_id").references(() => availabilityBlocks.id, { onDelete: "set null" }),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  label: varchar("label", { length: 255 }),
  source: varchar("source", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_availability_slots_listing_time").on(table.listingId, table.startTime),
  index("idx_availability_slots_range").on(table.listingId, table.startTime, table.endTime),
  check("valid_time_range", sql`end_time > start_time`),
]);

export const inquiries = pgTable("inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  eventDate: date("event_date").notNull(),
  eventTime: time("event_time").notNull(),
  guestCount: integer("guest_count").notNull(),
  eventType: varchar("event_type", { length: 50 }),
  specialRequirements: text("special_requirements"),
  status: inquiryStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_inquiries_customer_id").on(table.customerId),
  index("idx_inquiries_listing_id").on(table.listingId),
  index("idx_inquiries_status").on(table.status),
  index("idx_inquiries_customer_status").on(table.customerId, table.status),
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  inquiryId: uuid("inquiry_id").references(() => inquiries.id, { onDelete: "set null" }),
  eventDate: date("event_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  guestCount: integer("guest_count").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("valid_booking_time", sql`end_time > start_time`),
  index("idx_bookings_customer_id").on(table.customerId),
  index("idx_bookings_listing_id").on(table.listingId),
  index("idx_bookings_status").on(table.status),
  index("idx_bookings_event_date").on(table.eventDate),
  index("idx_bookings_listing_date").on(table.listingId, table.eventDate),
]);

export const bookingServices = pgTable("booking_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  serviceListingId: uuid("service_listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  packageId: uuid("package_id").references(() => servicePackages.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_booking_services_booking_id").on(table.bookingId),
]);

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  rating: smallint("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_reviews_customer_listing_unique").on(table.customerId, table.listingId),
  index("idx_reviews_listing_id").on(table.listingId),
  index("idx_reviews_customer_id").on(table.customerId),
  check("rating_check", sql`rating >= 1 AND rating <= 5`),
]);

export const favorites = pgTable("favorites", {
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.customerId, table.listingId] }),
  index("idx_favorites_customer_id").on(table.customerId),
]);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: conversationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.conversationId, table.userId] }),
  index("idx_conversation_participants_user_id").on(table.userId),
  index("idx_conversation_participants_conversation_id").on(table.conversationId),
]);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_messages_conversation_id").on(table.conversationId),
  index("idx_messages_created_at").on(table.conversationId, table.createdAt),
  index("idx_messages_sender").on(table.senderId),
]);

export const planSessions = pgTable("plan_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rawPrompt: text("raw_prompt").notNull(),
  parsedParams: jsonb("parsed_params"),
  status: planStatusEnum("status").notNull().default("processing"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_plan_sessions_customer_id").on(table.customerId),
]);

export const planRecommendations = pgTable("plan_recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => planSessions.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  matchScore: decimal("match_score", { precision: 3, scale: 2 }).notNull(),
  matchReason: text("match_reason"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  recommendationType: recommendationTypeEnum("recommendation_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_plan_recommendations_session_id").on(table.sessionId),
  check("match_score_check", sql`match_score >= 0 AND match_score <= 1`),
]);

export const contentFlags = pgTable("content_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  targetType: flagTargetTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  flagReason: text("flag_reason").notNull(),
  flaggerId: uuid("flagger_id").references(() => users.id, { onDelete: "set null" }),
  status: flagStatusEnum("status").notNull().default("pending"),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [
  index("idx_content_flags_status").on(table.status),
  index("idx_content_flags_target").on(table.targetType, table.targetId),
]);
