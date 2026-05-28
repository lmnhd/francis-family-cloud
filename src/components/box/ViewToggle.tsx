import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  currentPath: string;
  viewMode: "list" | "grid";
}

export function ViewToggle({ currentPath, viewMode }: Props) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <ToggleLink
        href={`${currentPath}?view=list`}
        active={viewMode === "list"}
        label="List view"
      >
        <List className="size-4" />
      </ToggleLink>
      <ToggleLink
        href={`${currentPath}?view=grid`}
        active={viewMode === "grid"}
        label="Grid view"
      >
        <LayoutGrid className="size-4" />
      </ToggleLink>
    </div>
  );
}

function ToggleLink({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "flex items-center justify-center px-2.5 py-1.5 text-sm transition-colors",
        active
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      )}
    >
      {children}
    </Link>
  );
}
