"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Folder as FolderType } from "@/lib/repos/folders";
import { FolderRow } from "./FolderRow";
import { FolderBulkActionBar } from "./FolderBulkActionBar";
import { FolderDeleteModal } from "./FolderDeleteModal";

interface Props {
  folders: FolderType[];
}

export function FolderList({ folders }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelectedIds(new Set(folders.map((folder) => folder.id)));
  const clearAll = () => setSelectedIds(new Set());
  const anySelected = selectedIds.size > 0;

  const deleteSelected = (ids: string[]) => {
    setDeleteIds(ids);
  };

  const confirmDelete = async () => {
    if (!deleteIds || deleteIds.length === 0) return;

    setDeleting(true);
    try {
      await Promise.allSettled(deleteIds.map((id) => fetch(`/api/folders/${id}`, { method: "DELETE" })));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        deleteIds.forEach((id) => next.delete(id));
        return next;
      });
      router.refresh();
    } finally {
      setDeleting(false);
      setDeleteIds(null);
    }
  };

  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <FolderRow
          key={folder.id}
          folder={folder}
          selected={selectedIds.has(folder.id)}
          anySelected={anySelected}
          onToggle={() => toggle(folder.id)}
          onDelete={() => deleteSelected([folder.id])}
        />
      ))}

      {anySelected && (
        <FolderBulkActionBar
          count={selectedIds.size}
          totalCount={folders.length}
          onClear={clearAll}
          onSelectAll={selectAll}
          onDelete={() => deleteSelected([...selectedIds])}
        />
      )}

      {deleteIds && (
        <FolderDeleteModal
          title={
            deleteIds.length === 1
              ? folders.find((folder) => folder.id === deleteIds[0])?.name ?? "Selected folder"
              : `${deleteIds.length} folders`
          }
          onConfirm={confirmDelete}
          onClose={() => setDeleteIds(null)}
          busy={deleting}
        />
      )}
    </div>
  );
}
