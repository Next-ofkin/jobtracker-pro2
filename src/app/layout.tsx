import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthRefresh from "@/components/AuthRefresh";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import { Toaster } from "sonner"; // ⬅️ NEW

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClientWithCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Navbar isAuthed={!!user} />
        <AuthRefresh /> {/* ensures UI updates instantly on auth changes */}
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <Toaster richColors position="top-center" /> {/* ⬅️ NEW */}
      </body>
    </html>
  );
}
