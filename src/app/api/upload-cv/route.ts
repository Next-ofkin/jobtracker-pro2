import { NextResponse } from "next/server";
import { createServerClientWithCookies } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createServerClientWithCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Validate file type and size
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 5MB" },
      { status: 400 }
    );
  }

  // ✅ store in subfolder "cv/<user_id>.pdf"
  const filePath = `cv/${user.id}.pdf`;

  const { error } = await supabase.storage
    .from("cv")
    .upload(filePath, file, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cv/${filePath}`;

  return NextResponse.json({ url: publicUrl });
}
