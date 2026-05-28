"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile {
  name: string;
  state: "pending" | "uploading" | "done" | "error";
  progress: number; // 0–100
  error?: string;
}

interface Props {
  folderId: string;
}

export function UploadDropzone({ folderId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadFile[]>([]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const startIdx = uploads.length;
      setUploads((prev) => [
        ...prev,
        ...files.map((f) => ({
          name: f.name,
          state: "pending" as const,
          progress: 0,
        })),
      ]);

      await Promise.allSettled(
        files.map(async (file, i) => {
          const idx = startIdx + i;
          const update = (patch: Partial<UploadFile>) =>
            setUploads((prev) =>
              prev.map((u, j) => (j === idx ? { ...u, ...patch } : u))
            );

          try {
            update({ state: "uploading", progress: 0 });

            // 1. Request presigned URL
            const presignRes = await fetch("/api/files/presign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                folderId,
                fileName: file.name,
                mimeType: file.type || "application/octet-stream",
                sizeBytes: file.size,
              }),
            });
            if (!presignRes.ok) {
              const { error } = await presignRes.json();
              update({ state: "error", error });
              return;
            }
            const { fileId, uploadUrl, s3Key } = await presignRes.json();

            // 2. Upload directly to S3 via XHR for progress tracking
            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  update({
                    progress: Math.round((e.loaded / e.total) * 100),
                  });
                }
              };
              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) resolve();
                else reject(new Error(`S3 responded ${xhr.status}`));
              };
              xhr.onerror = () => reject(new Error("Network error"));
              xhr.open("PUT", uploadUrl);
              xhr.setRequestHeader(
                "Content-Type",
                file.type || "application/octet-stream"
              );
              xhr.send(file);
            });

            // 3. Confirm completion on the server
            const completeRes = await fetch(`/api/files/${fileId}/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ s3Key }),
            });
            if (!completeRes.ok) {
              update({ state: "error", error: "Could not confirm upload" });
              return;
            }

            update({ state: "done", progress: 100 });
          } catch (err) {
            update({
              state: "error",
              error: err instanceof Error ? err.message : "Upload failed",
            });
          }
        })
      );

      router.refresh();
      setTimeout(
        () => setUploads((prev) => prev.filter((u) => u.state !== "done")),
        2000
      );
    },
    [folderId, router, uploads.length]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) uploadFiles(files);
    },
    [uploadFiles]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) uploadFiles(files);
    e.target.value = "";
  };

  const active = uploads.filter((u) => u.state !== "done");

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors",
          dragging
            ? "border-slate-400 bg-slate-100"
            : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
        )}
      >
        <Upload className="size-6 text-slate-400" />
        <p className="text-sm text-slate-500">
          Drop files here or{" "}
          <span className="font-medium text-slate-700">browse</span>
        </p>
        <p className="text-xs text-slate-400">Up to 100 MB per file</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {active.length > 0 && (
        <ul className="space-y-1.5">
          {active.map((u, i) => (
            <li
              key={i}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <div className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1 truncate text-slate-700">{u.name}</span>
                {u.state === "error" ? (
                  <span className="shrink-0 text-xs text-red-500">
                    {u.error}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs tabular-nums text-slate-400">
                    {u.progress}%
                  </span>
                )}
              </div>
              {u.state === "uploading" && (
                <div className="h-0.5 bg-slate-100">
                  <div
                    className="h-full bg-blue-500 transition-[width]"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
              {u.state === "error" && (
                <div className="h-0.5 bg-red-200" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
