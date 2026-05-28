import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { getOrCreateRootFolder } from "@/lib/repos/folders";
import { listFilesInFolder, getUserStorageBytes } from "@/lib/repos/files";
import { UploadDropzone } from "@/components/box/UploadDropzone";
import { FileRow } from "@/components/box/FileRow";
import { StorageWarning } from "@/components/box/StorageWarning";

export const dynamic = "force-dynamic";

// 5 GB soft limit per user. Raise here if needed.
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

export default async function BoxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userId = session.user.id;

  const [rootFolder, storageBytes] = await Promise.all([
    getOrCreateRootFolder(userId),
    getUserStorageBytes(userId),
  ]);

  const files = await listFilesInFolder(userId, rootFolder.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center gap-2">
        <FolderOpen className="size-5 text-slate-400" />
        <h1 className="text-xl font-semibold text-slate-900">My Box</h1>
      </div>

      <div className="space-y-4">
        <StorageWarning
          usedBytes={storageBytes}
          limitBytes={STORAGE_LIMIT_BYTES}
        />

        <UploadDropzone folderId={rootFolder.id} />

        {files.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No files yet. Drop some above to get started.
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {files.length} {files.length === 1 ? "file" : "files"}
            </p>
            <div className="relative space-y-1">
              {files.map((file) => (
                <FileRow key={file.id} file={file} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
