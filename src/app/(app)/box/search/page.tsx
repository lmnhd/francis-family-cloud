import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { getOrCreateRootFolder, listSubFolders } from "@/lib/repos/folders";
import { searchFilesInFolder } from "@/lib/repos/files";
import type { FileRecord } from "@/lib/repos/files";
import { FileRow } from "@/components/box/FileRow";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { q } = await searchParams;
  const userId = session.user.id;

  let results: FileRecord[] = [];
  if (q && q.trim().length > 0) {
    const rootFolder = await getOrCreateRootFolder(userId);
    const subFolders = await listSubFolders(userId, rootFolder.id);
    const allFolderIds = [rootFolder.id, ...subFolders.map((f) => f.id)];

    const perFolder = await Promise.all(
      allFolderIds.map((fid) => searchFilesInFolder(userId, fid, q.trim()))
    );
    results = perFolder.flat();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Search className="size-5 text-slate-400" />
        <h1 className="text-xl font-semibold text-slate-900">Search</h1>
      </div>

      <form method="GET" className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by file name…"
          autoFocus
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </form>

      {q && results.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">
          No files found for &ldquo;{q}&rdquo;.
        </p>
      )}

      {results.length > 0 && (
        <div className="relative space-y-1">
          {results.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
