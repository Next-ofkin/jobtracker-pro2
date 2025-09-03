// src/types/job.ts
export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  url: string;
  source: string;
  created_at: string;       // ISO timestamp from Supabase
  posted_at: string | null; // ISO or null (if source doesn't provide)
}
