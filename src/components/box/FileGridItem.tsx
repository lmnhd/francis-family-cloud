"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Link2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileRecord } from "@/lib/repos/files";
import { formatBytes } from "@/lib/format";
import { ShareModal } from "./ShareModal";
import { FileDetailSheet } from "./FileDetailSheet";

interface Props {
  file: FileRecord;
  previewUrl?: string;
  selected?: boolean;
  anySelected?: boolean;
  onToggle?: () => void;
  onPreview?: () => void;
}

export function FileGridItem({
  file,
  previewUrl,
  selected = false,
  anySelected = false,
  onToggle,
  onPreview,
}: Props) {
  const router = useRouter();
  const [showShare, setShowShare] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/api/files/${file.id}/download`;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${file.displayName}"? It will move to trash.`)) return;
    await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    router.refresh();
  };

  const isImage = file.mimeType.startsWith("image/");
  const emoji = file.mimeType.startsWith("video/")
    ? "🎬"
    : file.mimeType === "application/pdf"
    ? "📄"
    : file.mimeType.startsWith("audio/")
    ? "🎵"
    : "📄";

  return (
    <>
      <div
        onClick={() => { if (onPreview) { onPreview(); } else { setShowSheet(true); } }}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-xl border bg-white dark:bg-slate-900",
          selected
            ? "border-blue-400 dark:border-blue-500"
            : "border-slate-200 dark:border-slate-700"
        )}
      >
        {/* Checkbox ─────────────────────────────────────────────────────────
            Mobile: always visible so multi-select works without hover.
            Desktop: visible only on hover or when already selected.        */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
          aria-label={selected ? "Deselect" : "Select"}
          className={cn(
            "absolute left-2 top-2 z-10 transition-opacity",
            anySelected || selected
              ? "opacity-100"
              : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
          )}
        >
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded border-2 shadow transition-colors",
              selected
                ? "border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-400"
                : "border-slate-300 bg-white/90 dark:border-slate-500 dark:bg-slate-800/90"
            )}
          >
            {selected && (
              <svg viewBox="0 0 10 8" className="size-3 fill-current">
                <path
                  d="M1 4l3 3 5-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </button>

        {/* Thumbnail */}
        <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {isImage && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={file.displayName}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">
              {emoji}
            </div>
          )}
        </div>

        {/* Desktop-only hover overlay with quick actions.
            Hidden on mobile (touch devices get the detail sheet instead). */}
        <div className="absolute inset-0 hidden items-end bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:flex">
          <div className="flex w-full gap-1 p-2">
            <OverlayButton onClick={handleDownload} title="Download">
              <Download className="size-4" />
            </OverlayButton>
            <OverlayButton
              onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
              title="Share"
            >
              <Link2 className="size-4" />
            </OverlayButton>
            <OverlayButton onClick={handleDelete} title="Delete">
              <Trash2 className="size-4" />
            </OverlayButton>
          </div>
        </div>

        {/* File info */}
        <div className="px-2.5 py-2">
          <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
            {file.displayName}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {formatBytes(file.sizeBytes)}
          </p>
        </div>
      </div>

      {showShare && (
        <ShareModal file={file} onClose={() => setShowShare(false)} />
      )}
      {showSheet && (
        <FileDetailSheet file={file} onClose={() => setShowSheet(false)} />
      )}
    </>
  );
}

function OverlayButton({
  onClick,
  title,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center rounded-lg bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30"
    >
      {children}
    </button>
  );
}
