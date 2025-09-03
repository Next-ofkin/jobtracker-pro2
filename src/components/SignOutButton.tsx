"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  function handleSignOut() {
    start(async () => {
      // hit the server route to clear cookies
      const res = await fetch("/auth/sign-out", { method: "POST" });
      if (!res.ok) {
        toast.error("Could not sign out. Please try again.");
        return;
      }
      toast.success("Signed out");
      // navigate home and force server components to re-read cookies
      router.push("/");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="text-sm"
      onClick={handleSignOut}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </>
      )}
    </Button>
  );
}
