import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/auth/server";

export async function POST() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
