import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError, notFound } from "@/lib/utils/errors";
import { eq, and, desc, asc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const participant = await db.query.conversationParticipants.findFirst({
      where: (cp, { eq: eqFn, and: andFn }) =>
        andFn(eqFn(cp.conversationId, conversationId), eqFn(cp.userId, user.sub)),
    });
    if (!participant) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const messages = await db.query.messages.findMany({
      where: (m) => eq(m.conversationId, conversationId),
      orderBy: (m, { desc: descFn }) => descFn(m.createdAt),
      limit,
    });

    return NextResponse.json({ data: messages.reverse() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const participant = await db.query.conversationParticipants.findFirst({
      where: (cp, { eq: eqFn, and: andFn }) =>
        andFn(eqFn(cp.conversationId, conversationId), eqFn(cp.userId, user.sub)),
    });
    if (!participant) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;
    if (!content) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "content is required" } },
        { status: 400 }
      );
    }

    const [message] = await db
      .insert(schema.messages)
      .values({ conversationId, senderId: user.sub, content })
      .returning();

    await db
      .update(schema.conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(schema.conversationParticipants.conversationId, conversationId),
          eq(schema.conversationParticipants.userId, user.sub)
        )
      );

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    await db
      .update(schema.conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(schema.conversationParticipants.conversationId, conversationId),
          eq(schema.conversationParticipants.userId, user.sub)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
