"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Folder } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/format";

interface SharedFile {
  id: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
  previewUrl: string | null;
}

interface FolderData {
  name: string;
}

export default function SharedFolderPage() {
  const { ownerUserId, folderId } = useParams<{ ownerUserId: string; folderId: string }>();
  const [folder, setFolder] = useState<FolderData | null>(null);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/sharing/folder?owner=${ownerUserId}&folderId=${folderId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not authorized");
        return r.json();
      })
      .then(({ folder: f, files: ff }) => {
        setFolder(f);
        setFiles(ff);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ownerUserId, folderId]);

  if (loading) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;
  if (error) return <div className="py-20 text-center text-sm text-red-500">{error}</div>;

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="flex items-center gap-2 py-5">
            <Folder className="size-5 text-slate-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {folder?.name ?? "Shared folder"}
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-6">
          {files.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">This folder is empty.</p>
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                >
                  {file.mimeType.startsWith("image/") && file.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.previewUrl}
                      alt={file.displayName}
                      className="size-10 rounded-md object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-md bg-slate-100 text-xl dark:bg-slate-800">
                      {file.mimeType.startsWith("video/") ? "🎬" : file.mimeType === "application/pdf" ? "📄" : "📄"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {file.displayName}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {formatBytes(file.sizeBytes)} · {formatDate(file.updatedAt)}
                    </p>
                  </div>

                  <a
                    href={`/api/sharing/download?owner=${ownerUserId}&fileId=${file.id}`}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
