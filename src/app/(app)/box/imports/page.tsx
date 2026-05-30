import { redirect } from "next/navigation";
import { Cloud } from "lucide-react";
import { auth } from "@/auth";
import { DropboxImportPanel } from "@/components/box/DropboxImportPanel";
import { getOrCreateRootFolder } from "@/lib/repos/folders";
import { getProviderConnection } from "@/lib/repos/provider-connections";

export default async function ImportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [rootFolder, dropboxConnection] = await Promise.all([
    getOrCreateRootFolder(session.user.id),
    getProviderConnection(session.user.id, "dropbox"),
  ]);

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto max-w-5xl px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <Cloud className="size-5 text-slate-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Imports
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-6">
          <DropboxImportPanel
            connected={Boolean(dropboxConnection)}
            defaultFolderId={rootFolder.id}
          />
        </div>
      </div>
    </div>
  );
}
