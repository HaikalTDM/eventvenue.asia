import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray, desc, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { authenticate, requireRole } from "@/lib/auth/middleware";
import { handleApiError, notFound } from "@/lib/utils/errors";

/**
 * GET /api/v1/admin/moderation
 *
 * Returns flagged content for the moderation queue, joined to the
 * minimum context needed for an admin to make a call without leaving
 * the page (target preview, who flagged it, when).
 *
 * Query params:
 *   status   - "pending" | "resolved" | "all" (default "pending")
 *   limit    - default 50, max 100
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    const roleError = requireRole(user, "admin");
    if (roleError) return roleError;

    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending";
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1),
      100
    );

    const conditions: SQL[] = [];
    if (status === "pending" || status === "resolved") {
      conditions.push(eq(schema.contentFlags.status, status));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const flags = await db
      .select()
      .from(schema.contentFlags)
      .where(where)
      .orderBy(desc(schema.contentFlags.createdAt))
      .limit(limit);

    if (flags.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Resolve flagger user names in one batch.
    const flaggerIds = [
      ...new Set(flags.map((f) => f.flaggerId).filter((x): x is string => !!x)),
    ];
    const flaggers =
      flaggerIds.length > 0
        ? await db
            .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
            .from(schema.users)
            .where(inArray(schema.users.id, flaggerIds))
        : [];
    const flaggerMap = new Map(flaggers.map((f) => [f.id, f]));

    // Resolve target preview content per type. Done in three small queries.
    const reviewIds = flags.filter((f) => f.targetType === "review").map((f) => f.targetId);
    const listingIds = flags.filter((f) => f.targetType === "listing").map((f) => f.targetId);
    const messageIds = flags.filter((f) => f.targetType === "message").map((f) => f.targetId);

    const reviews =
      reviewIds.length > 0
        ? await db
            .select({
              id: schema.reviews.id,
              comment: schema.reviews.comment,
              rating: schema.reviews.rating,
              listingId: schema.reviews.listingId,
            })
            .from(schema.reviews)
            .where(inArray(schema.reviews.id, reviewIds))
        : [];
    const reviewMap = new Map(reviews.map((r) => [r.id, r]));

    const listings =
      listingIds.length > 0
        ? await db
            .select({
              id: schema.listings.id,
              title: schema.listings.title,
              slug: schema.listings.slug,
            })
            .from(schema.listings)
            .where(inArray(schema.listings.id, listingIds))
        : [];
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const messages =
      messageIds.length > 0
        ? await db
            .select({
              id: schema.messages.id,
              content: schema.messages.content,
              senderId: schema.messages.senderId,
            })
            .from(schema.messages)
            .where(inArray(schema.messages.id, messageIds))
        : [];
    const messageMap = new Map(messages.map((m) => [m.id, m]));

    const data = flags.map((f) => {
      let targetPreview = "";
      let targetTitle: string | null = null;
      if (f.targetType === "review") {
        const r = reviewMap.get(f.targetId);
        targetPreview = r?.comment ?? "(review removed)";
        targetTitle = r ? `${r.rating}\u2605 review` : null;
      } else if (f.targetType === "listing") {
        const l = listingMap.get(f.targetId);
        targetPreview = l?.title ?? "(listing removed)";
        targetTitle = l?.title ?? null;
      } else if (f.targetType === "message") {
        const m = messageMap.get(f.targetId);
        targetPreview = m?.content ?? "(message removed)";
        targetTitle = "Direct message";
      }

      const flagger = f.flaggerId ? flaggerMap.get(f.flaggerId) : null;

      return {
        id: f.id,
        type: f.targetType,
        targetId: f.targetId,
        targetTitle,
        targetPreview,
        flagReason: f.flagReason,
        status: f.status,
        flaggedBy: flagger
          ? { id: flagger.id, name: flagger.name, email: flagger.email }
          : { id: null, name: "System", email: null },
        createdAt: f.createdAt,
        resolvedAt: f.resolvedAt,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/v1/admin/moderation?flagId=...&action=resolve|dismiss
 *
 * "resolve"  -> marks the flag resolved and removes the flagged content
 *               (review.comment cleared, listing paused, message hidden).
 * "dismiss"  -> marks the flag resolved with no further action; the
 *               flagged content stays as-is.
 *
 * Both actions stamp resolvedBy with the acting admin's id and
 * resolvedAt with the current timestamp.
 */
export async function PUT(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    const roleError = requireRole(user, "admin");
    if (roleError) return roleError;

    const url = new URL(request.url);
    const flagId = url.searchParams.get("flagId");
    const action = url.searchParams.get("action");
    if (!flagId || (action !== "resolve" && action !== "dismiss")) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "flagId and action=resolve|dismiss are required",
          },
        },
        { status: 400 }
      );
    }

    const flag = await db.query.contentFlags.findFirst({
      where: (f, { eq: e }) => e(f.id, flagId),
    });
    if (!flag) throw notFound("Flag");

    if (action === "resolve") {
      // Take action against the flagged content.
      if (flag.targetType === "review") {
        await db
          .update(schema.reviews)
          .set({ comment: null })
          .where(eq(schema.reviews.id, flag.targetId));
      } else if (flag.targetType === "listing") {
        await db
          .update(schema.listings)
          .set({ status: "paused" })
          .where(eq(schema.listings.id, flag.targetId));
      } else if (flag.targetType === "message") {
        // No `hidden` column exists yet; clearing content is the
        // pragmatic equivalent until the schema gains a soft-hide flag.
        await db
          .update(schema.messages)
          .set({ content: "(removed by moderator)" })
          .where(eq(schema.messages.id, flag.targetId));
      }
    }

    await db
      .update(schema.contentFlags)
      .set({
        status: "resolved",
        resolvedBy: user!.sub,
        resolvedAt: new Date(),
      })
      .where(eq(schema.contentFlags.id, flagId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
