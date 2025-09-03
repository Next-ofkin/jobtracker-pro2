import { NextResponse } from "next/server";
import { createServerClientWithCookies } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createServerClientWithCookies();

  // This clears the Supabase auth cookies on the server
  await supabase.auth.signOut();

  // return 200 OK (no redirect; we'll handle navigation client-side)
  return NextResponse.json({ ok: true });
}
