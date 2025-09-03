// src/types/job.ts
import type { Database } from "./database";

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
