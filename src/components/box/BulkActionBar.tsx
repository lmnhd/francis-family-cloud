"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, X, CheckSquare } from "lucide-react";

interface Props {
  count: number;
  totalCount: number;
  selectedIds: Set<string>;
  onClear: () => void;
  onSelectAll: () => void;
  onDeleted: () => void;
}

export function BulkActionBar({
  count,
  totalCount,
  selectedIds,
  onClear,
  onSelectAll,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/files/download-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      const { files } = await res.json();

      for (const { url, fileName } of files as { url: string; fileName: string }[]) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Small delay so the browser has time to start each download.
        await new Promise((r) => setTimeout(r, 400));
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Move ${count} ${count === 1 ? "file" : "files"} to trash?`
      )
    )
      return;
    setDeleting(true);
    await Promise.allSettled(
      [...selectedIds].map((id) =>
        fetch(`/api/files/${id}`, { method: "DELETE" })
      )
    );
    setDeleting(false);
    onDeleted();
    router.refresh();
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4">
      <div className="flex items-center gap-1 rounded-2xl bg-slate-900 px-2 py-2 text-white shadow-2xl ring-1 ring-white/10 dark:bg-white dark:text-slate-900 dark:ring-slate-200">
        {/* Count + select all */}
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm font-semibold tabular-nums">{count}</span>
          <span className="text-sm text-white/60 dark:text-slate-500">
            {count === 1 ? "file" : "files"}
          </span>
          {count < totalCount && (
            <button
              onClick={onSelectAll}
              title="Select all"
              className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white dark:text-slate-500 dark:hover:bg-slate-100 dark:hover:text-slate-700"
            >
              <CheckSquare className="size-3.5" />
              All {totalCount}
            </button>
          )}
        </div>

        <div className="h-6 w-px bg-white/15 dark:bg-slate-200" />

        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={downloading || deleting}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50 dark:hover:bg-slate-100"
        >
          <Download className="size-4" />
          {downloading ? "Downloading…" : "Download"}
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={downloading || deleting}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-white/10 disabled:opacity-50 dark:text-red-500 dark:hover:bg-red-50"
        >
          <Trash2 className="size-4" />
          {deleting ? "Deleting…" : "Delete"}
        </button>

        <div className="h-6 w-px bg-white/15 dark:bg-slate-200" />

        {/* Dismiss */}
        <button
          onClick={onClear}
          title="Clear selection"
          className="rounded-xl p-2 hover:bg-white/10 dark:hover:bg-slate-100"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
