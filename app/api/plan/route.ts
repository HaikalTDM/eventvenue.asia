import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { extractPlanFromPrompt } from "@/lib/nlp-extractor";
import { extractPlanWithAi, AiExtractionError } from "@/lib/ai-extractor";
import { generatePlan } from "@/lib/plan-engine";
import { eq } from "drizzle-orm";
import type { Venue, Service, PlanResponse, PlanExtraction, Review, FAQ } from "@/lib/types";

/**
 * Resolve the plan extraction, preferring AI tool-calling and transparently
 * falling back to the regex NLP extractor when the AI path fails for a
 * recoverable reason (no API key, token/quota limits, or service unavailability).
 * The regex extractor is synchronous and never throws, so it is a safe backstop.
 */
async function resolveExtraction(prompt: string): Promise<PlanExtraction> {
  try {
    return await extractPlanWithAi(prompt);
  } catch (err) {
    if (err instanceof AiExtractionError && err.recoverable) {
      console.warn(`[plan] AI extraction fell back to NLP (${err.reason}): ${err.message}`);
      return extractPlanFromPrompt(prompt);
    }
    // Unexpected/non-recoverable error: still degrade gracefully to NLP rather
    // than failing the whole request, but log it at error level for visibility.
    console.error("[plan] Unexpected AI extraction error; using NLP fallback:", err);
    return extractPlanFromPrompt(prompt);
  }
}

async function fetchVenuesAndServices(): Promise<{ venues: Venue[]; services: Service[] }> {
  const listings = await db.query.listings.findMany({
    where: (l) => eq(l.status, "active"),
  });

  const venues: Venue[] = [];
  const services: Service[] = [];

  for (const item of listings) {
    const photos = await db.query.listingPhotos.findMany({
      where: (p) => eq(p.listingId, item.id),
    });
    const thumbnailUrl = photos.find((p) => p.isPrimary)?.url || photos[0]?.url || "";

    const amenityRows = await db
      .select({ name: schema.amenities.name })
      .from(schema.listingAmenities)
      .innerJoin(schema.amenities, eq(schema.listingAmenities.amenityId, schema.amenities.id))
      .where(eq(schema.listingAmenities.listingId, item.id));

    const eventTypeRows = await db
      .select({ name: schema.eventTypes.name })
      .from(schema.listingEventTypes)
      .innerJoin(schema.eventTypes, eq(schema.listingEventTypes.eventTypeId, schema.eventTypes.id))
      .where(eq(schema.listingEventTypes.listingId, item.id));

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.id, item.vendorId),
    });

    const blockedDates = await db.query.availabilityBlocks.findMany({
      where: (b) => eq(b.listingId, item.id),
    });

    const reviewRows = await db.query.reviews.findMany({
      where: (r) => eq(r.listingId, item.id),
      orderBy: (r, { desc: descFn }) => descFn(r.createdAt),
      limit: 10,
    });

    let reviews: Review[] = [];
    if (reviewRows.length > 0) {
      const userIds = [...new Set(reviewRows.map((r) => r.customerId))];
      const users = await db.query.users.findMany({
        where: (u, { inArray }) => inArray(u.id, userIds),
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      reviews = reviewRows.map((r) => ({
        id: r.id,
        reviewerName: userMap.get(r.customerId)?.name || "Anonymous",
        reviewerAvatar: userMap.get(r.customerId)?.avatarUrl || undefined,
        rating: r.rating,
        date: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "",
        text: r.comment || "",
      }));
    }

    const baseVenue = {
      reviews,
      faqs: [] as FAQ[],
      coordinates: { lat: 0, lng: 0 },
    };

    if (item.listingType === "venue") {
      venues.push({
        id: item.id,
        title: item.title,
        slug: item.slug,
        location: item.location || "",
        pricePerHour: Number(item.pricePerHour) || 0,
        currency: item.currency,
        capacity: item.capacity || 0,
        rating: Number(item.averageRating) || 0,
        reviewCount: item.reviewCount || 0,
        halalVerified: item.halalCertified,
        thumbnailUrl,
        galleryUrls: photos.map((p) => p.url),
        eventTypes: eventTypeRows.map((r) => r.name),
        amenities: amenityRows.map((r) => r.name),
        description: item.description || "",
        hostName: vendorProfile?.businessName || "",
        hostAvatar: undefined,
        hostResponseRate: 0,
        hostResponseTime: "",
        address: item.address || "",
        blockedDates: blockedDates.filter((b) => b.isBlocked).map((b) => b.date),
        ...baseVenue,
      });
    } else if (item.listingType === "service") {
      const packages = await db.query.servicePackages.findMany({
        where: (p) => eq(p.listingId, item.id),
      });
      const tags = await db.query.serviceTags.findMany({
        where: (t) => eq(t.listingId, item.id),
      });
      const servicePackage = packages.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        price: Number(p.price) || 0,
        currency: item.currency,
        unit: p.unit as "hourly" | "per_event" | "per_package",
        includes: [] as string[],
      }));

      services.push({
        id: item.id,
        vendorId: item.vendorId,
        title: item.title,
        slug: item.slug,
        category: (vendorProfile?.serviceCategory as Service["category"]) || "planning",
        location: item.location || "",
        description: item.description || "",
        thumbnailUrl,
        galleryUrls: photos.map((p) => p.url),
        packages: servicePackage,
        eventTypes: eventTypeRows.map((r) => r.name),
        tags: tags.map((t) => t.tag),
        rating: Number(item.averageRating) || 0,
        reviewCount: item.reviewCount || 0,
        halalCertified: item.halalCertified,
        portfolioUrls: [],
        availability: "",
        providerName: vendorProfile?.businessName || "",
        providerAvatar: undefined,
        responseRate: 0,
        responseTime: "",
        ...baseVenue,
      });
    }
  }

  return { venues, services };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt: string = body.prompt || "";

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const extraction = await resolveExtraction(prompt.trim());
    const { venues, services } = await fetchVenuesAndServices();
    const plan = generatePlan(extraction, venues, services);

    const response: PlanResponse = {
      extraction,
      plan,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan. Please try again." },
      { status: 500 }
    );
  }
}
