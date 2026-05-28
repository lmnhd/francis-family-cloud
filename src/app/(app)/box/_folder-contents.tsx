import type { Folder } from "@/lib/repos/folders";
import { listSubFolders } from "@/lib/repos/folders";
import { listFilesInFolder } from "@/lib/repos/files";
import { createPresignedPreviewUrl } from "@/lib/aws/presign";
import { Breadcrumb } from "@/components/box/Breadcrumb";
import { NewFolderButton } from "@/components/box/NewFolderButton";
import { FolderRow } from "@/components/box/FolderRow";
import { FileRow } from "@/components/box/FileRow";
import { FileGridItem } from "@/components/box/FileGridItem";
import { ViewToggle } from "@/components/box/ViewToggle";
import { UploadDropzone } from "@/components/box/UploadDropzone";
import { StorageWarning } from "@/components/box/StorageWarning";

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

interface Props {
  userId: string;
  currentFolder: Folder;
  breadcrumbPath: Folder[];
  storageBytes: number;
  viewMode: "list" | "grid";
  currentPath: string;
}

export async function FolderContents({
  userId,
  currentFolder,
  breadcrumbPath,
  storageBytes,
  viewMode,
  currentPath,
}: Props) {
  const [subFolders, files] = await Promise.all([
    listSubFolders(userId, currentFolder.id),
    listFilesInFolder(userId, currentFolder.id),
  ]);

  const previewUrls = await Promise.all(
    files.map((f) =>
      f.mimeType.startsWith("image/")
        ? createPresignedPreviewUrl(f.s3Key)
        : Promise.resolve(undefined)
    )
  );

  const isRoot = currentFolder.isRoot;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      {/* Breadcrumb */}
      <div className="mb-5">
        <Breadcrumb
          path={breadcrumbPath}
          currentFolder={isRoot ? null : currentFolder}
        />
      </div>

      <div className="space-y-4">
        <StorageWarning usedBytes={storageBytes} limitBytes={STORAGE_LIMIT_BYTES} />

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">
            {isRoot ? "My Box" : currentFolder.name}
          </h1>
          <div className="flex items-center gap-2">
            <NewFolderButton parentFolderId={currentFolder.id} />
            <ViewToggle currentPath={currentPath} viewMode={viewMode} />
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
            {/* Folders always in list view */}
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

            {/* Files */}
            {files.length > 0 && (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {files.length} {files.length === 1 ? "file" : "files"}
                </p>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {files.map((file, i) => (
                      <FileGridItem
                        key={file.id}
                        file={file}
                        previewUrl={previewUrls[i]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="relative space-y-1">
                    {files.map((file, i) => (
                      <FileRow
                        key={file.id}
                        file={file}
                        previewUrl={previewUrls[i]}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
