"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, X } from "lucide-react";
import type { Folder as FolderType } from "@/lib/repos/folders";
import type { FileRecord } from "@/lib/repos/files";

interface FolderItem {
  folder: FolderType;
  depth: number;
}

// Depth-first traversal to produce an ordered flat list with nesting depth.
function buildOrderedList(folders: FolderType[]): FolderItem[] {
  const result: FolderItem[] = [];

  function walk(parentIsRoot: boolean, parentId: string | null, depth: number) {
    const children = folders
      .filter((f) =>
        parentIsRoot ? f.isRoot : f.parentFolderId === parentId && !f.isRoot
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const folder of children) {
      result.push({ folder, depth });
      walk(false, folder.id, depth + 1);
    }
  }

  walk(true, null, 0);
  return result;
}

interface Props {
  file: FileRecord;
  onClose: () => void;
}

export function MoveModal({ file, onClose }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<FolderItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then(({ folders }: { folders: FolderType[] }) =>
        setItems(buildOrderedList(folders))
      )
      .finally(() => setLoading(false));
  }, []);

  const handleMove = async () => {
    if (!selectedId || selectedId === file.folderId) return;
    setMoving(true);
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: selectedId }),
    });
    setMoving(false);
    onClose();
    router.refresh();
  };

  const canMove = !!selectedId && selectedId !== file.folderId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Move file
            </h2>
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
              {file.displayName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Folder list */}
        <div className="max-h-64 overflow-y-auto p-2">
          {loading && (
            <p className="py-4 text-center text-sm text-slate-400">
              Loading folders…
            </p>
          )}

          {!loading && items.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">
              No other folders found.
            </p>
          )}

          {!loading &&
            items.map(({ folder, depth }) => {
              const isCurrent = folder.id === file.folderId;
              const isSelected = folder.id === selectedId;
              return (
                <button
                  key={folder.id}
                  onClick={() => !isCurrent && setSelectedId(folder.id)}
                  disabled={isCurrent}
                  style={{ paddingLeft: `${12 + depth * 18}px` }}
                  className={`flex w-full items-center gap-2 rounded-lg py-2 pr-3 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : isCurrent
                      ? "cursor-not-allowed opacity-40"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Folder className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">
                    {folder.isRoot ? "My Box" : folder.name}
                  </span>
                  {isCurrent && (
                    <span className="ml-auto shrink-0 text-xs text-slate-400 dark:text-slate-600">
                      current
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={!canMove || moving}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {moving ? "Moving…" : "Move here"}
          </button>
        </div>
      </div>
    </div>
  );
}
