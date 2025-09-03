import { redirect } from "next/navigation";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import SignInForm from "./SignInForm";

export default async function Page() {
  const supabase = await createServerClientWithCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return <SignInForm />;
}
