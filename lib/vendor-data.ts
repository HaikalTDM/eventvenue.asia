import type { VendorUser, Service, VendorBooking } from "@/lib/types";

export const mockVendorUsers: VendorUser[] = [];

export const mockServices: Service[] = [];

export const mockVendorBookings: VendorBooking[] = [];

export const serviceCategoryOptions: Array<{ key: string; label: string }> = [];

export const vendorBookingStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
};
