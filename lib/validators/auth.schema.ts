import { z } from "zod";

/**
 * Normalize a Malaysian phone number into canonical `+60XXXXXXXXX` form.
 *
 * Accepts inputs like "12 345 6789", "0123456789", "+60 12-345 6789".
 * Strips all non-digit characters, drops a leading `0` (local prefix), drops
 * a leading `60` (country code without `+`), and prepends `+60`. The final
 * result is validated against the Malaysian mobile regex.
 */
const malaysianPhone = z
  .string()
  .min(1, "Phone is required")
  .max(32)
  .transform((raw) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 0) return "";
    let local = digits;
    if (local.startsWith("60")) local = local.slice(2);
    else if (local.startsWith("0")) local = local.slice(1);
    return `+60${local}`;
  })
  .refine((v) => /^\+60\d{9,10}$/.test(v), {
    message: "Invalid Malaysian phone number",
  });

const optionalMalaysianPhone = z
  .string()
  .max(32)
  .optional()
  .transform((raw) => {
    if (!raw) return undefined;
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 0) return undefined;
    let local = digits;
    if (local.startsWith("60")) local = local.slice(2);
    else if (local.startsWith("0")) local = local.slice(1);
    return `+60${local}`;
  })
  .refine((v) => v === undefined || /^\+60\d{9,10}$/.test(v), {
    message: "Invalid Malaysian phone number",
  });

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  phone: malaysianPhone,
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const vendorRegisterSchema = z.object({
  vendorType: z.enum(["venue_owner", "service_provider"]),
  businessName: z.string().min(1, "Business name is required").max(255),
  businessDescription: z.string().optional(),
  businessWebsite: z.string().url("Invalid URL").max(255).optional().or(z.literal("")),
  businessLocation: z.string().max(255).optional(),
  serviceCategory: z.string().max(100).nullable().optional(),
  user: z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    phone: optionalMalaysianPhone,
    password: z.string().min(8).max(128),
  }),
  documents: z.array(z.object({
    docType: z.enum(["business_license", "halal_cert", "identity", "other"]),
    fileUrl: z.string().url(),
  })).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VendorRegisterInput = z.infer<typeof vendorRegisterSchema>;
