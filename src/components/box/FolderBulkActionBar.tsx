"use client";

import { CheckSquare, Trash2, X } from "lucide-react";

interface Props {
  count: number;
  totalCount: number;
  onClear: () => void;
  onSelectAll: () => void;
  onDelete: () => void;
}

export function FolderBulkActionBar({
  count,
  totalCount,
  onClear,
  onSelectAll,
  onDelete,
}: Props) {
  return (
    <div className="fixed inset-x-3 bottom-4 z-50 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:px-4">
      <div className="flex items-center justify-between gap-1 rounded-2xl bg-slate-900 px-2 py-2 text-white shadow-2xl ring-1 ring-white/10 dark:bg-white dark:text-slate-900 dark:ring-slate-200 sm:justify-start">
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm font-semibold tabular-nums">{count}</span>
          <span className="hidden text-sm text-white/60 dark:text-slate-500 sm:inline">
            {count === 1 ? "folder" : "folders"}
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

        <div className="flex items-center gap-0.5">
          <button
            onClick={onDelete}
            title="Delete selected folders"
            className="flex shrink-0 items-center gap-1.5 rounded-xl p-2 text-sm font-medium text-red-400 hover:bg-white/10 dark:text-red-500 dark:hover:bg-red-50 sm:px-3"
          >
            <Trash2 className="size-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        <div className="h-6 w-px shrink-0 bg-white/15 dark:bg-slate-200" />

        <button
          onClick={onClear}
          title="Clear selection"
          className="shrink-0 rounded-xl p-2 hover:bg-white/10 dark:hover:bg-slate-100"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
