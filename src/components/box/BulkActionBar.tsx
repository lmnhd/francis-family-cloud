"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Download, FolderInput, Trash2, X } from "lucide-react";
import { MoveModal } from "./MoveModal";

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
  const [showMove, setShowMove] = useState(false);

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
        await new Promise((r) => setTimeout(r, 400));
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Move ${count} ${count === 1 ? "file" : "files"} to trash?`)) return;
    setDeleting(true);
    await Promise.allSettled(
      [...selectedIds].map((id) => fetch(`/api/files/${id}`, { method: "DELETE" }))
    );
    setDeleting(false);
    onDeleted();
    router.refresh();
  };

  const handleMove = async (folderId: string) => {
    await Promise.allSettled(
      [...selectedIds].map((id) =>
        fetch(`/api/files/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId }),
        })
      )
    );
    onDeleted();
    router.refresh();
  };

  const busy = downloading || deleting;

  return (
    <>
      {/* Full-width on mobile (with safe-area padding), centered pill on desktop */}
      <div className="fixed inset-x-3 bottom-4 z-50 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:px-4">
        <div className="flex items-center justify-between gap-1 rounded-2xl bg-slate-900 px-2 py-2 text-white shadow-2xl ring-1 ring-white/10 dark:bg-white dark:text-slate-900 dark:ring-slate-200 sm:justify-start">
          {/* Count + select all */}
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-semibold tabular-nums">{count}</span>
            <span className="hidden text-sm text-white/60 dark:text-slate-500 sm:inline">
              {count === 1 ? "file" : "files"}
            </span>
            {count < totalCount && (
              <button
                onClick={onSelectAll}
                title={`Select all ${totalCount}`}
                className="ml-1 flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white dark:text-slate-500 dark:hover:bg-slate-100 dark:hover:text-slate-700"
              >
                <CheckSquare className="size-3.5" />
                <span className="tabular-nums">{totalCount}</span>
              </button>
            )}
          </div>

          <div className="h-6 w-px shrink-0 bg-white/15 dark:bg-slate-200" />

          {/* Actions — icon-only on mobile, icon + label on sm+ */}
          <div className="flex items-center gap-0.5">
            <BarButton
              onClick={handleDownload}
              disabled={busy}
              title="Download"
              icon={<Download className="size-4" />}
              label={downloading ? "Downloading…" : "Download"}
            />
            <BarButton
              onClick={() => setShowMove(true)}
              disabled={busy}
              title="Move to folder"
              icon={<FolderInput className="size-4" />}
              label="Move"
            />
            <BarButton
              onClick={handleDelete}
              disabled={busy}
              title="Delete"
              icon={<Trash2 className="size-4" />}
              label={deleting ? "Deleting…" : "Delete"}
              danger
            />
          </div>

          <div className="h-6 w-px shrink-0 bg-white/15 dark:bg-slate-200" />

          {/* Dismiss */}
          <button
            onClick={onClear}
            title="Clear selection"
            className="shrink-0 rounded-xl p-2 hover:bg-white/10 dark:hover:bg-slate-100"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {showMove && (
        <MoveModal
          title={`${count} ${count === 1 ? "file" : "files"}`}
          onMove={handleMove}
          onClose={() => setShowMove(false)}
        />
      )}
    </>
  );
}

function BarButton({
  onClick,
  disabled,
  title,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  const colorClasses = danger
    ? "text-red-400 dark:text-red-500 hover:bg-white/10 dark:hover:bg-red-50"
    : "hover:bg-white/10 dark:hover:bg-slate-100";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex shrink-0 items-center gap-1.5 rounded-xl p-2 text-sm font-medium disabled:opacity-50 sm:px-3 ${colorClasses}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
