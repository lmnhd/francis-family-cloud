import Link from "next/link";
import { Home } from "lucide-react";
import type { Folder } from "@/lib/repos/folders";

interface Props {
  path: Folder[];
  currentFolder: Folder | null;
}

export function Breadcrumb({ path, currentFolder }: Props) {
  const hasAncestors = path.length > 0 || currentFolder !== null;

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
      <Link
        href="/box"
        className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <Home className="size-3.5" />
        {!hasAncestors && "My Box"}
        {hasAncestors && <span className="hidden sm:inline">My Box</span>}
      </Link>

      {path.map((folder) => (
        <span key={folder.id} className="flex min-w-0 items-center gap-1">
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <Link
            href={`/box/folder/${folder.id}`}
            className="min-w-0 truncate rounded-md px-1.5 py-1 font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            {folder.name}
          </Link>
        </span>
      ))}

      {currentFolder && (
        <span className="flex min-w-0 items-center gap-1">
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="min-w-0 truncate rounded-md px-1.5 py-1 font-semibold text-slate-900 dark:text-slate-100">
            {currentFolder.name}
          </span>
        </span>
      )}
    </nav>
  );
}
