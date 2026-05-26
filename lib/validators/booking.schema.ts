import { z } from "zod";

export const bookingCreateSchema = z.object({
  listingId: z.string().uuid(),
  inquiryId: z.string().uuid().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  guestCount: z.number().int().positive(),
  totalAmount: z.number().positive(),
});

export const bookingServiceSchema = z.object({
  serviceListingId: z.string().uuid(),
  packageId: z.string().uuid().optional(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["confirmed", "in_progress", "completed", "cancelled"]),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingStatusInput = z.infer<typeof bookingStatusSchema>;
