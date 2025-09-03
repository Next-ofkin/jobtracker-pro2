import { createClient } from "@/lib/supabase";

export default async function TestSupabase() {
  const supabase = createClient();

  // Ask for zero rows — we only care if the query runs without "table not found" errors
  const { error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .limit(1);

  const { error: cfgError } = await supabase
    .from("user_config")
    .select("*")
    .limit(1);

  return (
    <pre>
      {JSON.stringify(
        {
          jobsOk: !jobsError,
          userConfigOk: !cfgError,
          jobsError,
          cfgError,
        },
        null,
        2
      )}
    </pre>
  );
}
