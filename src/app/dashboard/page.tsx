// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import JobsTable from "@/components/JobsTable";
import type { Job } from "@/types/job";

const PAGE_SIZE = 10;

export default async function DashboardPage({
  // In Next.js 15 server components, searchParams is a Promise
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const supabase = await createServerClientWithCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // Await searchParams once, then read values
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const pageNum = Number(sp.page ?? "1");
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Base query: only this user's jobs (RLS safe)
  let query = supabase
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  // Optional text search
  if (q) {
    query = query.or(
      `title.ilike.%${q}%,company.ilike.%${q}%,source.ilike.%${q}%`
    );
  }

  // Newest first by posted_at, then created_at as fallback
  const { data: rows, error, count } = await query
    .order("posted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return (
      <section className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-red-600">Failed to load jobs: {error.message}</p>
      </section>
    );
  }

  // Strongly type the rows without using `any`
  // (Supabase types aren't generated here, so we assert the shape we store.)
  const initialJobs: Job[] = (rows ?? []).map((r) => ({
    id: String((r as Record<string, unknown>).id),
    user_id: String((r as Record<string, unknown>).user_id),
    title: String((r as Record<string, unknown>).title),
    company:
      (r as Record<string, unknown>).company === null
        ? null
        : String((r as Record<string, unknown>).company),
    url: String((r as Record<string, unknown>).url),
    source: String((r as Record<string, unknown>).source),
    created_at: String((r as Record<string, unknown>).created_at),
    posted_at:
      (r as Record<string, unknown>).posted_at === null
        ? null
        : String((r as Record<string, unknown>).posted_at),
  }));

  return (
    <section className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Your Jobs</h1>
      <p className="mt-1 text-gray-600">
        Showing jobs fetched for <span className="font-mono">{user.email}</span>
      </p>

      <div className="mt-6">
        <JobsTable
          initialJobs={initialJobs}
          total={count ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          initialQuery={q}
        />
      </div>
    </section>
  );
}
