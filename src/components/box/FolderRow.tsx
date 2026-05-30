"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Folder, Pencil, Trash2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Folder as FolderType } from "@/lib/repos/folders";
import { FamilyShareModal } from "./FamilyShareModal";

interface Props {
  folder: FolderType;
  selected?: boolean;
  anySelected?: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
}

export function FolderRow({
  folder,
  selected = false,
  anySelected = false,
  onToggle,
  onDelete,
}: Props) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(folder.name);
  const [showShare, setShowShare] = useState(false);

  const saveRename = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === folder.name) { setRenaming(false); return; }
    await fetch(`/api/folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setRenaming(false);
    router.refresh();
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg border bg-white px-4 py-3 hover:border-slate-300 dark:bg-slate-900 dark:hover:border-slate-600",
          selected
            ? "border-blue-400 dark:border-blue-500"
            : "border-slate-200 dark:border-slate-700"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className={cn(
            "shrink-0 transition-opacity",
            anySelected || selected
              ? "opacity-100"
              : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
          )}
          aria-label={selected ? "Deselect folder" : "Select folder"}
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

        <Folder className="size-5 shrink-0 text-slate-400 dark:text-slate-500" />

        <div className="min-w-0 flex-1">
          {renaming ? (
            <form
              onSubmit={(e) => { e.preventDefault(); saveRename(); }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <button type="submit" className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400">Save</button>
              <button type="button" onClick={() => { setRenaming(false); setName(folder.name); }}>
                <X className="size-3 text-slate-400" />
              </button>
            </form>
          ) : (
            <Link
              href={`/box/folder/${folder.id}`}
              className="block truncate text-sm font-medium text-slate-800 hover:text-slate-900 dark:text-slate-200"
            >
              {folder.name}
            </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setShowShare(true)}
            title="Family sharing"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <Users className="size-3.5" />
          </button>
          <button
            onClick={() => setRenaming(true)}
            title="Rename"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => onDelete?.()}
            title="Delete folder"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
          >
            <Trash2 className="size-3.5" />
          </button>
          <ChevronRight className="size-4 text-slate-300 dark:text-slate-600" />
        </div>
      </div>

      {showShare && (
        <FamilyShareModal
          type="folder"
          resourceId={folder.id}
          displayName={folder.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
