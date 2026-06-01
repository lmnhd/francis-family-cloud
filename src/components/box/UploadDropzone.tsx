"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderUp, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile {
  id: number;
  name: string;
  state: "pending" | "preparing" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface UploadCandidate {
  file: File;
  relativePath?: string;
}

interface Props {
  folderId: string;
}

interface BrowserFileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath?: string;
}

interface BrowserFileSystemFileEntry extends BrowserFileSystemEntry {
  file: (success: (file: File) => void, error: (error: DOMException) => void) => void;
}

interface BrowserFileSystemDirectoryEntry extends BrowserFileSystemEntry {
  createReader: () => {
    readEntries: (
      success: (entries: BrowserFileSystemEntry[]) => void,
      error: (error: DOMException) => void
    ) => void;
  };
}

// Upload a single chunk via XHR. Returns the ETag header from S3.
function uploadChunk(
  url: string,
  data: Blob,
  mimeType: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded, e.total);
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.getResponseHeader("ETag") ?? "");
      } else {
        reject(new Error(`Upload responded ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mimeType || "application/octet-stream");
    xhr.send(data);
  });
}

function getBrowserRelativePath(file: File): string | undefined {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath || undefined;
}

function cleanPathSegments(relativePath?: string): string[] {
  if (!relativePath) return [];
  const segments = relativePath.split("/").filter(Boolean);
  return segments.slice(0, -1).filter((segment) => segment !== "." && segment !== "..");
}

function normalizeRelativePath(value?: string): string | undefined {
  if (!value) return undefined;
  return value.replace(/^\/+/, "").replace(/\\/g, "/");
}

function getEntryRelativePath(entry: BrowserFileSystemEntry, parentPath = ""): string {
  const directPath = normalizeRelativePath(entry.fullPath);
  if (directPath) return directPath;
  return parentPath ? `${parentPath}/${entry.name}` : entry.name;
}

function dedupeUploadCandidates(candidates: UploadCandidate[]): UploadCandidate[] {
  const seen = new Set<string>();
  return candidates.filter(({ file, relativePath }) => {
    const key = `${relativePath ?? file.name}::${file.size}::${file.lastModified}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function ensureFolderPath(
  parentFolderId: string,
  segments: string[],
  cache: Map<string, string>
): Promise<string> {
  if (segments.length === 0) return parentFolderId;

  const key = segments.join("/");
  const cached = cache.get(key);
  if (cached) return cached;

  const res = await fetch("/api/folders/ensure-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentFolderId, pathSegments: segments }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Could not create folder path" }));
    throw new Error(error);
  }

  const { folderId } = (await res.json()) as { folderId: string };
  cache.set(key, folderId);
  return folderId;
}

function readFileEntry(
  entry: BrowserFileSystemFileEntry,
  relativePath: string
): Promise<UploadCandidate> {
  return new Promise((resolve, reject) => {
    entry.file(
      (file) => resolve({ file, relativePath }),
      (error) => reject(error)
    );
  });
}

async function readDirectoryEntries(
  entry: BrowserFileSystemDirectoryEntry
): Promise<BrowserFileSystemEntry[]> {
  const reader = entry.createReader();
  const entries: BrowserFileSystemEntry[] = [];

  while (true) {
    const batch = await new Promise<BrowserFileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (batch.length === 0) break;
    entries.push(...batch);
  }

  return entries;
}

async function walkEntry(
  entry: BrowserFileSystemEntry,
  parentPath = ""
): Promise<UploadCandidate[]> {
  const relativePath = getEntryRelativePath(entry, parentPath);

  if (entry.isFile) {
    return [await readFileEntry(entry as BrowserFileSystemFileEntry, relativePath)];
  }

  if (entry.isDirectory) {
    const children = await readDirectoryEntries(entry as BrowserFileSystemDirectoryEntry);
    const nested = await Promise.all(children.map((child) => walkEntry(child, relativePath)));
    return nested.flat();
  }

  return [];
}

export function UploadDropzone({ folderId }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const uploadIdRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadFile[]>([]);

  const uploadFiles = useCallback(
    async (candidates: UploadCandidate[]) => {
      const normalized = dedupeUploadCandidates(candidates.map((candidate) => ({
        file: candidate.file,
        relativePath: normalizeRelativePath(candidate.relativePath),
      })));
      const folderCache = new Map<string, string>();
      const uploadItems = normalized.map((candidate) => ({
        id: uploadIdRef.current++,
        name: candidate.relativePath ?? candidate.file.name,
        state: "pending" as const,
        progress: 0,
      }));

      setUploads((prev) => [...prev, ...uploadItems]);

      await Promise.allSettled(
        normalized.map(async ({ file, relativePath }, i) => {
          const uploadId = uploadItems[i].id;
          const update = (patch: Partial<UploadFile>) =>
            setUploads((prev) =>
              prev.map((u) => (u.id === uploadId ? { ...u, ...patch } : u))
            );

          try {
            update({ state: "preparing", progress: 0 });
            const mime = file.type || "application/octet-stream";
            const targetFolderId = await ensureFolderPath(
              folderId,
              cleanPathSegments(relativePath),
              folderCache
            );
            update({ state: "uploading", progress: 0 });

            // 1. Request presign (single or multipart)
            const presignRes = await fetch("/api/files/presign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                folderId: targetFolderId,
                fileName: file.name,
                mimeType: mime,
                sizeBytes: file.size,
              }),
            });
            if (!presignRes.ok) {
              const { error } = await presignRes.json();
              update({ state: "error", error });
              return;
            }

            const presignData = await presignRes.json();
            const { fileId, s3Key, isMultipart } = presignData;

            let completeBody: object;

            if (isMultipart) {
              // ── Multipart upload ────────────────────────────────────────────
              const { uploadId, parts, partSize } = presignData as {
                uploadId: string;
                parts: { partNumber: number; uploadUrl: string }[];
                partSize: number;
              };

              let uploadedBytes = 0;
              const uploadedParts: { partNumber: number; etag: string }[] = [];

              for (const { partNumber, uploadUrl } of parts) {
                const start = (partNumber - 1) * partSize;
                const chunk = file.slice(start, start + partSize);

                const etag = await uploadChunk(uploadUrl, chunk, mime, (loaded) => {
                  const total = uploadedBytes + loaded;
                  update({ progress: Math.round((total / file.size) * 100) });
                });

                uploadedParts.push({ partNumber, etag });
                uploadedBytes += chunk.size;
                update({ progress: Math.round((uploadedBytes / file.size) * 100) });
              }

              completeBody = { s3Key, uploadId, parts: uploadedParts };
            } else {
              // ── Single-part upload ──────────────────────────────────────────
              const { uploadUrl } = presignData as { uploadUrl: string };
              await uploadChunk(uploadUrl, file, mime, (loaded, total) => {
                update({ progress: Math.round((loaded / total) * 100) });
              });
              completeBody = { s3Key };
            }

            // 3. Confirm with server
            const completeRes = await fetch(`/api/files/${fileId}/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(completeBody),
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
    [folderId, router]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);

      const itemEntries = Array.from(e.dataTransfer.items)
        .map(
          (item) =>
            (item as unknown as { webkitGetAsEntry?: () => BrowserFileSystemEntry | null })
              .webkitGetAsEntry?.()
        )
        .filter((entry): entry is BrowserFileSystemEntry => Boolean(entry));

      if (itemEntries.length > 0) {
        const nested = await Promise.all(itemEntries.map((entry) => walkEntry(entry)));
        const candidates = nested.flat();
        if (candidates.length) uploadFiles(candidates);
        return;
      }

      const candidates = Array.from(e.dataTransfer.files).map((file) => ({
        file,
        relativePath: normalizeRelativePath(getBrowserRelativePath(file)),
      }));
      if (candidates.length) uploadFiles(candidates);
    },
    [uploadFiles]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files ?? []).map((file) => ({
      file,
      relativePath: normalizeRelativePath(getBrowserRelativePath(file)),
    }));
    if (f.length) uploadFiles(f);
    e.target.value = "";
  };

  const active = uploads.filter((u) => u.state !== "done");
  const anyPreparing = active.some((u) => u.state === "preparing");

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 transition-colors",
          dragging
            ? "border-slate-400 bg-slate-100 dark:border-slate-500 dark:bg-slate-800"
            : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        )}
      >
        <Upload className="size-6 text-slate-400 dark:text-slate-500" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Drop files or folders here
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Upload className="size-4" />
            Files
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FolderUp className="size-4" />
            Folder
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">Up to 5 GB per file</p>
        {anyPreparing && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
            <Loader2 className="size-3.5 animate-spin" />
            Preparing folder paths before upload
          </div>
        )}
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onInputChange} />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onInputChange}
          {...{ webkitdirectory: "", directory: "" }}
        />
      </div>

      {active.length > 0 && (
        <ul className="space-y-1.5">
          {active.map((u, i) => (
            <li key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1 truncate text-slate-700 dark:text-slate-300">{u.name}</span>
                {u.state === "preparing" ? (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <Loader2 className="size-3.5 animate-spin" />
                    Preparing
                  </span>
                ) : u.state === "error" ? (
                  <span className="shrink-0 text-xs text-red-500">{u.error}</span>
                ) : (
                  <span className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">
                    {u.progress}%
                  </span>
                )}
              </div>
              {u.state === "uploading" && (
                <div className="h-0.5 bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full bg-blue-500 transition-[width]"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
              {u.state === "error" && <div className="h-0.5 bg-red-200 dark:bg-red-900" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
