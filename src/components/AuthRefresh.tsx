"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AuthRefresh() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // Whenever auth state changes (sign-in, sign-out, token refresh),
      // refresh the current route so server components get the new user.
      router.refresh();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router, supabase]);

  return null; // nothing to render
}
