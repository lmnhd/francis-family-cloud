"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

const OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc",  label: "Oldest first" },
  { value: "name_asc",  label: "Name A → Z"  },
  { value: "name_desc", label: "Name Z → A"  },
  { value: "size_desc", label: "Largest first" },
  { value: "size_asc",  label: "Smallest first" },
];

interface Props {
  current: string;       // e.g. "date_desc"
  viewMode: "list" | "grid";
}

export function SortSelector({ current, viewMode }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (combo: string) => {
    const [sort, dir] = combo.split("_");
    const params = new URLSearchParams();
    params.set("sort", sort);
    params.set("dir", dir);
    if (viewMode === "grid") params.set("view", "grid");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900">
      <ArrowUpDown className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="cursor-pointer bg-transparent text-sm text-slate-700 focus:outline-none dark:text-slate-300"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
