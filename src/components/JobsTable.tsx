"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCcw, Search, Download } from "lucide-react";
import { toast } from "sonner";
import type { Job } from "@/types/job";

interface JobsTableProps {
  initialJobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  initialQuery: string;
}

type Action = "idle" | "refresh" | "fetch";

export default function JobsTable({
  initialJobs,
  total,
  page,
  pageSize,
  initialQuery,
}: JobsTableProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<Action>("idle");

  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(initialQuery);

  useEffect(() => {
    setJobs(initialJobs);
    setQ(initialQuery);
  }, [initialJobs, initialQuery]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  function setParam(key: "q" | "page", value?: string) {
    const p = new URLSearchParams(params.toString());
    if (value && value.length) p.set(key, value);
    else p.delete(key);
    if (key === "q") p.delete("page"); // reset page on new search
    router.push(`${pathname}?${p.toString()}`);
  }

  function goToPage(next: number) {
    const p = new URLSearchParams(params.toString());
    p.set("page", String(next));
    router.push(`${pathname}?${p.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setParam("q", q.trim());
  }

  function handleRefresh() {
    setAction("refresh");
    startTransition(() => {
      router.refresh();
      // when the transition finishes, isPending flips to false automatically
      // we also reset our action state shortly after to keep UI clean
      // (not strictly necessary, but nice for consistency)
      setTimeout(() => setAction("idle"), 0);
    });
  }

  async function handleFetchNow() {
    setAction("fetch");
    startTransition(async () => {
      toast.message("Fetching latest jobs…");
      const res = await fetch("/api/fetch", { cache: "no-store" });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = (json as { error?: string }).error ?? "Fetch failed";
        toast.error(err);
        setAction("idle");
        return;
      }
      const inserted = (json as { inserted?: number }).inserted ?? 0;
      toast.success(`Inserted ${inserted} job(s)`);
      router.refresh();
      setAction("idle");
    });
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full max-w-md items-center gap-2"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search title, company, or source…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            Search
          </Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isPending}
            title="Refresh"
          >
            {isPending && action === "refresh" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing…
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>

          <Button onClick={handleFetchNow} disabled={isPending} title="Run fetch now">
            {isPending && action === "fetch" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Fetch now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Posted</th>
              <th className="px-3 py-2 font-medium">Link</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  No jobs yet. Try “Fetch now”.
                </td>
              </tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="px-3 py-2">{j.title}</td>
                  <td className="px-3 py-2">{j.company ?? "-"}</td>
                  <td className="px-3 py-2">{j.source}</td>
                  <td className="px-3 py-2">
                    {j.posted_at
                      ? new Date(j.posted_at).toLocaleString()
                      : new Date(j.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={j.url}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Page {page} of {totalPages} • {total} result{total === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page <= 1 || isPending}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isPending}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
