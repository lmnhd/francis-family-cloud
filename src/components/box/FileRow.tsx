"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Link2, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileRecord } from "@/lib/repos/files";
import { formatBytes, formatDate } from "@/lib/format";
import { ShareModal } from "./ShareModal";

interface Props {
  file: FileRecord;
  previewUrl?: string;
  selected?: boolean;
  anySelected?: boolean;
  onToggle?: () => void;
}

export function FileRow({
  file,
  previewUrl,
  selected = false,
  anySelected = false,
  onToggle,
}: Props) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.displayName);
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleDownload = () => { window.location.href = `/api/files/${file.id}/download`; };

  const handleRename = async () => {
    if (newName.trim() === file.displayName) { setRenaming(false); return; }
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: newName.trim() }),
    });
    setRenaming(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${file.displayName}"? It will move to trash.`)) return;
    await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-lg border bg-white px-3 py-3 hover:border-slate-300 dark:bg-slate-900 dark:hover:border-slate-600",
          selected
            ? "border-blue-400 dark:border-blue-500"
            : "border-slate-200 dark:border-slate-700"
        )}
      >
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            "shrink-0 transition-opacity",
            anySelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          aria-label={selected ? "Deselect" : "Select"}
        >
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded border-2 transition-colors",
              selected
                ? "border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-400"
                : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
            )}
          >
            {selected && (
              <svg viewBox="0 0 10 8" className="size-3 fill-current">
                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </button>

        <FileThumbnail mimeType={file.mimeType} previewUrl={previewUrl} name={file.displayName} />

        <div className="min-w-0 flex-1">
          {renaming ? (
            <form onSubmit={(e) => { e.preventDefault(); handleRename(); }} className="flex items-center gap-2">
              <input
                autoFocus value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <button type="submit" className="text-xs text-slate-600 dark:text-slate-400">Save</button>
              <button type="button" onClick={() => { setRenaming(false); setNewName(file.displayName); }}>
                <X className="size-3 text-slate-400" />
              </button>
            </form>
          ) : (
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{file.displayName}</p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {formatBytes(file.sizeBytes)} · {formatDate(file.updatedAt)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <ActionButton onClick={handleDownload} title="Download"><Download className="size-3.5" /></ActionButton>
          <ActionButton onClick={() => setShowShare(true)} title="Share"><Link2 className="size-3.5" /></ActionButton>
          <ActionButton onClick={() => setShowMenu((v) => !v)} title="More"><MoreHorizontal className="size-3.5" /></ActionButton>
        </div>

        {showMenu && (
          <div className="absolute right-4 top-full z-10 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <button onClick={() => { setRenaming(true); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <Pencil className="size-3.5" /> Rename
            </button>
            <button onClick={() => { setShowMenu(false); handleDelete(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
              <Trash2 className="size-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {showShare && <ShareModal file={file} onClose={() => setShowShare(false)} />}
    </>
  );
}

function FileThumbnail({ mimeType, previewUrl, name }: { mimeType: string; previewUrl?: string; name: string }) {
  const isImage = mimeType.startsWith("image/");
  if (isImage && previewUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={previewUrl} alt={name} className="size-10 shrink-0 rounded-md object-cover" loading="lazy" />
    );
  }
  const emoji = mimeType.startsWith("video/") ? "🎬" : mimeType === "application/pdf" ? "📄" : mimeType.startsWith("audio/") ? "🎵" : "📄";
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xl dark:bg-slate-800">{emoji}</div>
  );
}

function ActionButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
      {children}
    </button>
  );
}
