import { z } from "zod";

export const inquiryCreateSchema = z.object({
  listingId: z.string().uuid(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  eventTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM or HH:MM:SS"),
  guestCount: z.number().int().positive(),
  eventType: z.string().max(50).optional(),
  specialRequirements: z.string().optional(),
});

export const inquiryStatusSchema = z.object({
  status: z.enum(["accepted", "approved", "proceed", "ongoing", "completed", "cancelled"]),
});

export type InquiryCreateInput = z.infer<typeof inquiryCreateSchema>;
export type InquiryStatusInput = z.infer<typeof inquiryStatusSchema>;
