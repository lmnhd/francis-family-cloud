import type { Folder } from "@/lib/repos/folders";
import { listSubFolders } from "@/lib/repos/folders";
import type { FileRecord } from "@/lib/repos/files";
import { listFilesInFolder } from "@/lib/repos/files";
import { createPresignedPreviewUrl } from "@/lib/aws/presign";
import { Breadcrumb } from "@/components/box/Breadcrumb";
import { NewFolderButton } from "@/components/box/NewFolderButton";
import { FolderRow } from "@/components/box/FolderRow";
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
      case "date":
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
      f.mimeType.startsWith("image/")
        ? createPresignedPreviewUrl(f.s3Key)
        : Promise.resolve(undefined)
    )
  );

  const isRoot = currentFolder.isRoot;
  const sortCombo = `${sortBy}_${sortDir}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-5">
        <Breadcrumb
          path={breadcrumbPath}
          currentFolder={isRoot ? null : currentFolder}
        />
      </div>

      <div className="space-y-4">
        <StorageWarning usedBytes={storageBytes} limitBytes={STORAGE_LIMIT_BYTES} />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">
            {isRoot ? "My Box" : currentFolder.name}
          </h1>
          <div className="flex items-center gap-2">
            <NewFolderButton parentFolderId={currentFolder.id} />
            <SortSelector current={sortCombo} viewMode={viewMode} />
            <ViewToggle currentPath={currentPath} viewMode={viewMode} sortCombo={sortCombo} />
          </div>
        </div>

        <UploadDropzone folderId={currentFolder.id} />

        {subFolders.length === 0 && files.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            {isRoot
              ? "No files yet. Drop some above to get started."
              : "This folder is empty. Drop files above or create a sub-folder."}
          </p>
        ) : (
          <div className="space-y-3">
            {subFolders.length > 0 && (
              <div className="space-y-1">
                {subFolders.map((folder) => (
                  <FolderRow key={folder.id} folder={folder} />
                ))}
              </div>
            )}

            {subFolders.length > 0 && files.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700" />
            )}

            {files.length > 0 && (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {files.length} {files.length === 1 ? "file" : "files"}
                </p>
                <FileList files={files} previewUrls={previewUrls} viewMode={viewMode} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
