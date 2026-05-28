"use client";

import { useState } from "react";
import type { FileRecord } from "@/lib/repos/files";
import { FileRow } from "./FileRow";
import { FileGridItem } from "./FileGridItem";
import { BulkActionBar } from "./BulkActionBar";
import { MediaLightbox, isLightboxable } from "./MediaLightbox";

interface Props {
  files: FileRecord[];
  previewUrls: (string | undefined)[];
  viewMode: "list" | "grid";
}

export function FileList({ files, previewUrls, viewMode }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelectedIds(new Set(files.map((f) => f.id)));
  const clearAll = () => setSelectedIds(new Set());
  const anySelected = selectedIds.size > 0;

  // Open lightbox when clicking a media file (image or video) on desktop.
  const handlePreview = (index: number) => {
    if (isLightboxable(files[index].mimeType)) {
      setLightboxIndex(index);
    }
    // Non-media files: FileRow/FileGridItem handle their own click (detail sheet, download).
  };

  return (
    <div className="space-y-1.5">
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {files.map((file, i) => (
            <FileGridItem
              key={file.id}
              file={file}
              previewUrl={previewUrls[i]}
              selected={selectedIds.has(file.id)}
              anySelected={anySelected}
              onToggle={() => toggle(file.id)}
              onPreview={() => handlePreview(i)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {files.map((file, i) => (
            <FileRow
              key={file.id}
              file={file}
              previewUrl={previewUrls[i]}
              selected={selectedIds.has(file.id)}
              anySelected={anySelected}
              onToggle={() => toggle(file.id)}
              onPreview={() => handlePreview(i)}
            />
          ))}
        </div>
      )}

      {anySelected && (
        <BulkActionBar
          count={selectedIds.size}
          totalCount={files.length}
          selectedIds={selectedIds}
          onClear={clearAll}
          onSelectAll={selectAll}
          onDeleted={clearAll}
        />
      )}

      {lightboxIndex !== null && (
        <MediaLightbox
          files={files}
          previewUrls={previewUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
