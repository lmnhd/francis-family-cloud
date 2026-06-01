import Link from "next/link";
import { ArrowUpLeft, Home } from "lucide-react";
import type { Folder } from "@/lib/repos/folders";

interface Props {
  path: Folder[];
  currentFolder: Folder | null;
}

export function Breadcrumb({ path, currentFolder }: Props) {
  const hasAncestors = path.length > 0 || currentFolder !== null;
  const upHref = currentFolder
    ? path.length > 0
      ? `/box/folder/${path[path.length - 1].id}`
      : "/box"
    : null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/box"
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-3 py-2 font-medium text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:min-h-0 sm:px-1.5 sm:py-1"
        >
          <Home className="size-4 sm:size-3.5" />
          {!hasAncestors && "My Box"}
          {hasAncestors && <span className="sm:hidden">My Box</span>}
          {hasAncestors && <span className="hidden sm:inline">My Box</span>}
        </Link>

        {upHref && (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="text-slate-300 dark:text-slate-600 sm:mx-0.5">/</span>
            <Link
              href={upHref}
              aria-label="Up one level"
              title="Up one level"
              className="flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-100 sm:min-h-0 sm:px-1.5 sm:py-1"
            >
              <ArrowUpLeft className="size-4 sm:size-3.5" />
              <span className="sm:hidden">Up one level</span>
              <span className="hidden sm:inline">Up</span>
            </Link>
          </span>
        )}

        {path.map((folder) => (
          <span key={folder.id} className="flex min-w-0 items-center gap-1.5">
            <span className="text-slate-300 dark:text-slate-600 sm:mx-0.5">/</span>
            <Link
              href={`/box/folder/${folder.id}`}
              className="min-h-11 min-w-0 truncate rounded-lg border border-transparent px-3 py-2 font-medium text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:min-h-0 sm:px-1.5 sm:py-1"
            >
              {folder.name}
            </Link>
          </span>
        ))}

        {currentFolder && (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="text-slate-300 dark:text-slate-600 sm:mx-0.5">/</span>
            <span className="min-h-11 min-w-0 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:min-h-0 sm:border-0 sm:bg-transparent sm:px-1.5 sm:py-1">
              {currentFolder.name}
            </span>
          </span>
        )}
      </div>
    </nav>
  );
}
