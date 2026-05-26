import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  phone: z.string().min(1, "Phone is required").max(20),
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
    phone: z.string().max(20).optional(),
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
