import type { Folder } from "@/lib/repos/folders";
import { listSubFolders } from "@/lib/repos/folders";
import type { FileRecord } from "@/lib/repos/files";
import { listFilesInFolder } from "@/lib/repos/files";
import { shouldGeneratePreview } from "@/lib/previews";
import { Breadcrumb } from "@/components/box/Breadcrumb";
import { NewFolderButton } from "@/components/box/NewFolderButton";
import { FolderList } from "@/components/box/FolderList";
import { FileList } from "@/components/box/FileList";
import { ViewToggle } from "@/components/box/ViewToggle";
import { SortSelector } from "@/components/box/SortSelector";
import { UploadDropzone } from "@/components/box/UploadDropzone";
import { StorageWarning } from "@/components/box/StorageWarning";

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

interface Props {
  userId: string;
  currentFolder: Folder;
  breadcrumbPath: Folder[];
  storageBytes: number;
  viewMode: "list" | "grid";
  sortBy: string;
  sortDir: string;
  currentPath: string;
}

function sortFiles(files: FileRecord[], sortBy: string, sortDir: string): FileRecord[] {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...files].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return dir * a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" });
      case "size":
        return dir * (a.sizeBytes - b.sizeBytes);
      default:
        return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    }
  });
}

export async function FolderContents({
  userId,
  currentFolder,
  breadcrumbPath,
  storageBytes,
  viewMode,
  sortBy,
  sortDir,
  currentPath,
}: Props) {
  const [subFolders, rawFiles] = await Promise.all([
    listSubFolders(userId, currentFolder.id),
    listFilesInFolder(userId, currentFolder.id),
  ]);

  const files = sortFiles(rawFiles, sortBy, sortDir);

  const previewUrls = await Promise.all(
    files.map((f) =>
      shouldGeneratePreview(f.mimeType, f.displayName)
        ? `/api/sharing/thumbnail?owner=${userId}&fileId=${f.id}`
        : Promise.resolve(undefined)
    )
  );

  const isRoot = currentFolder.isRoot;
  const sortCombo = `${sortBy}_${sortDir}`;
  const folderName = isRoot ? "My Box" : currentFolder.name;
  const isEmpty = subFolders.length === 0 && files.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          {/* Breadcrumb row */}
          <div className="pt-3 pb-1">
            <Breadcrumb
              path={breadcrumbPath}
              currentFolder={isRoot ? null : currentFolder}
            />
          </div>

          {/* Title + toolbar row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {folderName}
            </h1>
            <div className="flex items-center gap-1.5">
              <NewFolderButton parentFolderId={currentFolder.id} />
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
              <SortSelector current={sortCombo} viewMode={viewMode} />
              <ViewToggle currentPath={currentPath} viewMode={viewMode} sortCombo={sortCombo} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-6">
          <div className="space-y-4">
            <StorageWarning usedBytes={storageBytes} limitBytes={STORAGE_LIMIT_BYTES} />

            <UploadDropzone folderId={currentFolder.id} />

            {isEmpty ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                  {isRoot ? "No files yet." : "This folder is empty."}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                  Drop files above to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Folders */}
                {subFolders.length > 0 && (
                  <section>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Folders
                    </p>
                    <FolderList folders={subFolders} />
                  </section>
                )}

                {/* Files */}
                {files.length > 0 && (
                  <section>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {files.length} {files.length === 1 ? "File" : "Files"}
                    </p>
                    <FileList files={files} previewUrls={previewUrls} viewMode={viewMode} />
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
