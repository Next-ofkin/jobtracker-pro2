import { redirect } from "next/navigation";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import UploadCV from "@/components/UploadCV";

export default async function Page() {
  const supabase = await createServerClientWithCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  return (
    <section className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Upload your CV</h1>
      <UploadCV />
    </section>
  );
}
