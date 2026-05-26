import { z } from "zod";

export const reviewCreateSchema = z.object({
  listingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
