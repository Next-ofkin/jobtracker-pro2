// app/api/fetch/route.ts
import { NextResponse } from "next/server";
import { createServerClientWithCookies } from "@/lib/supabase-server";

/** ---------------- Types ----------------- */
type NormalizedJob = {
  title: string;
  company: string;
  url: string;
  source: "remotive" | "jobicy";
  description?: string;
  tags?: string[];
  posted_at: Date | null;
};

type RemotiveJob = {
  title: string;
  company_name: string;
  url: string;
  description?: string;
  tags?: string[];
  publication_date?: string;      // ISO string
  candidate_required_location?: string;
};

type RemotiveResponse = {
  jobs: RemotiveJob[];
};

type JobicyJob = {
  jobTitle?: string;
  title?: string;
  companyName?: string;
  company?: string;
  url?: string;
  jobUrl?: string;
  applyUrl?: string;
  jobDescription?: string;
  description?: string;
  tags?: string[];
  // observed variants across feeds
  jobPosted?: string | number;    // ISO, or timestamp
  date?: string | number;
  created_at?: string;
  published_at?: string;
};

type JobicyResponse = { jobs?: JobicyJob[] } | JobicyJob[];

/** -------------- Helpers ----------------- */
async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "JobTrackerPro/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

// role keywords
const ROLE_WORDS = [
  "virtual assistant",
  "admin",
  "administrative",
  "data entry",
  "office assistant",
] as const;

// visa keywords
const VISA_RE = /(visa|sponsor(ship)?|work\s*permit)/i;

function matches(job: NormalizedJob, requireVisa: boolean) {
  const haystack = [
    job.title,
    job.company,
    job.description ?? "",
    (job.tags ?? []).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const hasRole = ROLE_WORDS.some((k) => haystack.includes(k));
  const hasVisa = VISA_RE.test(haystack);

  return hasRole && (requireVisa ? hasVisa : true);
}

function dedupe(jobs: NormalizedJob[]) {
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    const key = j.url.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(j);
    }
  }
  return out;
}

function parseDate(d: unknown): Date | null {
  if (!d) return null;
  if (typeof d === "number") {
    // assume ms or s
    const n = d > 1e12 ? d : d * 1000;
    const dt = new Date(n);
    return isNaN(dt.getTime()) ? null : dt;
  }
  if (typeof d === "string") {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

/** -------- Source-normalizers (typed) ----- */
function normalizeRemotive(data: RemotiveResponse): NormalizedJob[] {
  const list = Array.isArray(data.jobs) ? data.jobs : [];
  return list.map((j) => ({
    title: j.title ?? "",
    company: j.company_name ?? "",
    url: j.url ?? "",
    source: "remotive" as const,
    description: j.description ?? "",
    tags: j.tags ?? [],
    posted_at: parseDate(j.publication_date) // ISO, e.g. "2025-09-02T12:34:56"
  }));
}

function normalizeJobicy(data: JobicyResponse): NormalizedJob[] {
  const raw = Array.isArray(data) ? data : data.jobs ?? [];
  return raw.map((j) => {
    const title = j.jobTitle ?? j.title ?? "";
    const company = j.companyName ?? j.company ?? "";
    const url = j.url ?? j.jobUrl ?? j.applyUrl ?? "";
    const description = j.jobDescription ?? j.description ?? "";
    const tags = j.tags ?? [];
    // try multiple possible fields for posted date
    const posted =
      parseDate(j.jobPosted) ??
      parseDate(j.published_at) ??
      parseDate(j.created_at) ??
      parseDate(j.date);

    return { title, company, url, source: "jobicy" as const, description, tags, posted_at: posted };
  });
}

/** ----------------- Route ----------------- */
export async function GET(req: Request) {
  const supabase = await createServerClientWithCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Please sign in, then call /api/fetch again." },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const wideFlag = url.searchParams.get("wide");
  const requireVisa = !(wideFlag && wideFlag === "1");

  // days cutoff (default 10)
  const daysParam = url.searchParams.get("days");
  const days = Math.max(1, Number(daysParam ?? "10"));
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results: NormalizedJob[] = [];
  const errors: Record<string, string> = {};
  const stats: Record<string, number> = {};

  // fetch both sources in parallel
  const [remotiveJobs, jobicyJobs] = await Promise.all([
    getJSON<RemotiveResponse>("https://remotive.com/api/remote-jobs")
      .then((data) =>
        normalizeRemotive(data)
          .filter((j) => j.posted_at && j.posted_at >= cutoff)
          .filter((j) => matches(j, requireVisa))
      )
      .catch((e) => {
        errors.remotive = e instanceof Error ? e.message : String(e);
        return [] as NormalizedJob[];
      }),
    getJSON<JobicyResponse>("https://jobicy.com/api/v2/remote-jobs")
      .then((data) =>
        normalizeJobicy(data)
          .filter((j) => j.posted_at && j.posted_at >= cutoff)
          .filter((j) => matches(j, requireVisa))
      )
      .catch((e) => {
        errors.jobicy = e instanceof Error ? e.message : String(e);
        return [] as NormalizedJob[];
      }),
  ]);

  stats.remotive = remotiveJobs.length;
  stats.jobicy = jobicyJobs.length;
  results.push(...remotiveJobs, ...jobicyJobs);

  // dedupe + sort newest first by posted_at
  const normalized = dedupe(results)
    .filter((j) => j.title && j.url && j.posted_at)
    .sort((a, b) => (b.posted_at!.getTime() - a.posted_at!.getTime()));

  const rows = normalized.map((job) => ({
    user_id: user.id,
    title: job.title,
    company: job.company,
    url: job.url,
    source: job.source,
    posted_at: job.posted_at?.toISOString() ?? null,
  }));

  const { error } = await supabase
    .from("jobs")
    .upsert(rows, { onConflict: "url" });

  const inserted = error ? 0 : rows.length;

  return NextResponse.json({
    success: true,
    inserted,
    found: normalized.length,
    perSource: stats,
    visaRequired: requireVisa,
    days,
    cutoff: cutoff.toISOString(),
    errors: Object.keys(errors).length ? errors : undefined,
  });
}
