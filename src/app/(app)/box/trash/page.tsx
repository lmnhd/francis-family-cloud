import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { listTrashedFiles } from "@/lib/repos/files";
import { formatBytes, formatDate } from "@/lib/format";
import { RestoreButton } from "@/components/box/RestoreButton";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const files = await listTrashedFiles(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Trash2 className="size-5 text-slate-400" />
        <h1 className="text-xl font-semibold text-slate-900">Trash</h1>
      </div>

      {files.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Trash is empty.</p>
      ) : (
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-700">{file.displayName}</p>
                <p className="text-xs text-slate-400">
                  {formatBytes(file.sizeBytes)} · Deleted {formatDate(file.deletedAt ?? file.updatedAt)}
                </p>
              </div>
              <RestoreButton fileId={file.id} />
            </div>
          ))}
          <p className="pt-2 text-center text-xs text-slate-400">
            Files in trash are permanently deleted after 30 days.
          </p>
        </div>
      )}
    </div>
  );
}
