import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/server";
import { handleApiError, notFound } from "@/lib/utils/errors";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userOrResp = await requireUser();
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const conversations = await db
      .select()
      .from(schema.conversationParticipants)
      .innerJoin(schema.conversations, eq(schema.conversationParticipants.conversationId, schema.conversations.id))
      .where(eq(schema.conversationParticipants.userId, user.id))
      .orderBy(desc(schema.conversations.createdAt));

    const conversationIds = conversations.map((c) => c.conversations.id);

    const lastMessages = await Promise.all(
      conversationIds.map(async (cid) => {
        const msgs = await db.query.messages.findMany({
          where: (m) => eq(m.conversationId, cid),
          orderBy: (m, { desc: descFn }) => descFn(m.createdAt),
          limit: 1,
        });
        return msgs[0] || null;
      })
    );

    const data = conversations.map((c, i) => ({
      id: c.conversations.id,
      type: c.conversations.type,
      title: c.conversations.title,
      lastReadAt: c.conversation_participants.lastReadAt,
      lastMessage: lastMessages[i] || null,
      createdAt: c.conversations.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userOrResp = await requireUser();
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const body = await request.json();
    const { type, title, participantIds } = body;

    const [conversation] = await db
      .insert(schema.conversations)
      .values({
        type: type || "direct",
        title: title || null,
      })
      .returning();

    const allParticipants = [...new Set([user.id, ...(participantIds || [])])];
    await db.insert(schema.conversationParticipants).values(
      allParticipants.map((uid) => ({
        conversationId: conversation.id,
        userId: uid,
      }))
    );

    return NextResponse.json({ data: conversation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
