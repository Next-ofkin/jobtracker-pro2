"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, FileText } from "lucide-react";

export default function UploadCV() {
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const router = useRouter();

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  function validateFile(f: File) {
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 5MB");
      return false;
    }
    return true;
  }

  async function handleUpload() {
    if (!file) {
      toast.error("Please select a PDF file first");
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-cv", {
      method: "POST",
      body: formData,
    });

    setPending(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Upload failed" }));
      toast.error(error || "Upload failed");
      return;
    }

    const { url } = await res.json();
    setUploadedUrl(url);
    toast.success("CV uploaded!");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div
        className="flex h-40 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f && validateFile(f)) setFile(f);
        }}
      >
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          id="cv-input"
          // single file only (no multiple attribute)
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && validateFile(f)) {
              setFile(f);
            } else {
              setFile(null);
            }
          }}
        />
        <label
          htmlFor="cv-input"
          className="cursor-pointer text-center text-sm text-gray-600"
        >
          {file ? (
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {file.name}
            </span>
          ) : (
            "Drag & drop or click to choose your CV (PDF only)"
          )}
        </label>
      </div>

      <Button
        onClick={handleUpload}
        className="w-full"
        disabled={pending || !file}
        title={!file ? "Choose a PDF first" : undefined}
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload CV
          </>
        )}
      </Button>

      {uploadedUrl && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">✅ CV uploaded successfully!</p>
          <p className="mt-1 text-green-900">Your public link:</p>

          {/* Readonly field that wraps nicely */}
          <div className="mt-2">
            <input
              readOnly
              value={uploadedUrl}
              className="w-full rounded-md border bg-white/70 px-3 py-2 text-[13px] text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300 break-all"
            />
          </div>

          {/* Helpful actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100"
            >
              Open
            </a>
            <a
              href={uploadedUrl}
              download
              className="inline-flex items-center rounded-md border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100"
            >
              Download
            </a>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(uploadedUrl);
                  toast.success("Link copied to clipboard");
                } catch {
                  // Fallback copy if clipboard API is blocked
                  const temp = document.createElement("input");
                  temp.value = uploadedUrl;
                  document.body.appendChild(temp);
                  temp.select();
                  document.execCommand("copy");
                  document.body.removeChild(temp);
                  toast.success("Link copied to clipboard");
                }
              }}
              className="inline-flex items-center rounded-md border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100"
            >
              Copy link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
