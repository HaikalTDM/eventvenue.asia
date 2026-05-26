import { NextResponse } from "next/server";

let inquiries: Array<Record<string, unknown>> = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newInquiry = {
      id: `inq-${Date.now()}`,
      status: "accept",
      createdAt: new Date().toISOString(),
      ...body,
    };
    inquiries.unshift(newInquiry);
    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error) {
    console.error("Inquiry creation error:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(inquiries);
}
