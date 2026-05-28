import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Folder } from "@/lib/repos/folders";

interface Props {
  path: Folder[]; // folders between root and current (exclusive of root)
  currentFolder: Folder | null; // null means we're at root
}

export function Breadcrumb({ path, currentFolder }: Props) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        href="/box"
        className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        My Box
      </Link>

      {path.map((folder) => (
        <span key={folder.id} className="flex items-center gap-1">
          <ChevronRight className="size-3.5 text-slate-400" />
          <Link
            href={`/box/folder/${folder.id}`}
            className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {folder.name}
          </Link>
        </span>
      ))}

      {currentFolder && (
        <span className="flex items-center gap-1">
          <ChevronRight className="size-3.5 text-slate-400" />
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {currentFolder.name}
          </span>
        </span>
      )}
    </nav>
  );
}
