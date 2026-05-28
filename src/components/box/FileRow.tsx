"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FolderInput, Link2, MoreHorizontal, Pencil, Trash2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileRecord } from "@/lib/repos/files";
import { formatBytes, formatDate } from "@/lib/format";
import { ShareModal } from "./ShareModal";
import { MoveModal } from "./MoveModal";
import { FileDetailSheet } from "./FileDetailSheet";
import { FamilyShareModal } from "./FamilyShareModal";

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
  const [showMove, setShowMove] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [showFamilyShare, setShowFamilyShare] = useState(false);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/api/files/${file.id}/download`;
  };

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${file.displayName}"? It will move to trash.`)) return;
    await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      {/* Tapping the row (on any device) opens the detail sheet */}
      <div
        onClick={() => setShowSheet(true)}
        className={cn(
          "group relative flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-3 hover:border-slate-300 dark:bg-slate-900 dark:hover:border-slate-600",
          selected
            ? "border-blue-400 dark:border-blue-500"
            : "border-slate-200 dark:border-slate-700"
        )}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
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

        <div className="min-w-0 flex-1" onClick={stop}>
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

        {/* Desktop quick actions — hover only */}
        <div className="hidden shrink-0 items-center gap-1 md:flex md:opacity-0 md:transition-opacity md:group-hover:opacity-100" onClick={stop}>
          <QuickButton onClick={handleDownload} title="Download"><Download className="size-3.5" /></QuickButton>
          <QuickButton onClick={(e) => { e.stopPropagation(); setShowShare(true); }} title="Share"><Link2 className="size-3.5" /></QuickButton>
          <QuickButton onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }} title="More"><MoreHorizontal className="size-3.5" /></QuickButton>
        </div>

        {/* Mobile: always-visible ··· button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowSheet(true); }}
          className="flex shrink-0 items-center justify-center rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
        >
          <MoreHorizontal className="size-4" />
        </button>

        {/* Desktop dropdown menu */}
        {showMenu && (
          <div className="absolute right-4 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900" onClick={stop}>
            <MenuButton onClick={() => { setRenaming(true); setShowMenu(false); }} icon={<Pencil className="size-3.5" />}>Rename</MenuButton>
            <MenuButton onClick={() => { setShowShare(true); setShowMenu(false); }} icon={<Link2 className="size-3.5" />}>Share link</MenuButton>
            <MenuButton onClick={() => { setShowMove(true); setShowMenu(false); }} icon={<FolderInput className="size-3.5" />}>Move to…</MenuButton>
            <MenuButton onClick={() => { setShowFamilyShare(true); setShowMenu(false); }} icon={<Users className="size-3.5" />}>Family sharing…</MenuButton>
            <MenuButton onClick={handleDelete} icon={<Trash2 className="size-3.5" />} danger>Delete</MenuButton>
          </div>
        )}
      </div>

      {showShare && <ShareModal file={file} onClose={() => setShowShare(false)} />}
      {showMove && <MoveModal file={file} onClose={() => setShowMove(false)} />}
      {showSheet && <FileDetailSheet file={file} onClose={() => setShowSheet(false)} />}
      {showFamilyShare && (
        <FamilyShareModal
          type="file"
          resourceId={file.id}
          displayName={file.displayName}
          onClose={() => setShowFamilyShare(false)}
        />
      )}
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

function QuickButton({ onClick, title, children }: { onClick: (e: React.MouseEvent) => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
      {children}
    </button>
  );
}

function MenuButton({ onClick, icon, children, danger }: { onClick: (e: React.MouseEvent) => void; icon: React.ReactNode; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-sm",
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
      )}
    >
      {icon} {children}
    </button>
  );
}
