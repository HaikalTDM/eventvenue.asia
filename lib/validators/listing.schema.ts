import { z } from "zod";

export const listingCreateSchema = z.object({
  listingType: z.enum(["venue", "service"]),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().max(255).optional(),
  address: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  pricePerHour: z.number().positive().optional(),
  currency: z.string().length(3).default("MYR"),
  halalCertified: z.boolean().default(false),
  coordinates: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  eventTypes: z.array(z.string()).optional(),
});

export const listingUpdateSchema = listingCreateSchema.partial();

export const listingQuerySchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().optional(),
  capacity: z.coerce.number().int().optional(),
  halal: z.coerce.boolean().optional(),
  amenities: z.string().optional(),
  eventTypes: z.string().optional(),
  type: z.enum(["venue", "service"]).optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["price_asc", "price_desc", "rating", "newest"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export type ListingCreateInput = z.infer<typeof listingCreateSchema>;
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>;
export type ListingQueryInput = z.infer<typeof listingQuerySchema>;
