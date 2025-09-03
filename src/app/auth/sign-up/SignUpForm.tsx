"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignUpForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setPending(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email to confirm, then sign in.");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Sign up with email & password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Sign up"
              )}
            </Button>

            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="text-blue-600 underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
