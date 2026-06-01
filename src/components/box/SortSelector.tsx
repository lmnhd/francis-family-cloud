"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name A → Z" },
  { value: "name_desc", label: "Name Z → A" },
  { value: "size_desc", label: "Largest first" },
  { value: "size_asc", label: "Smallest first" },
];

interface Props {
  current: string;
  viewMode: "list" | "grid";
}

export function SortSelector({ current, viewMode }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const handleChange = (combo: string) => {
    const [sort, dir] = combo.split("_");
    const params = new URLSearchParams();
    params.set("sort", sort);
    params.set("dir", dir);
    if (viewMode === "grid") params.set("view", "grid");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const currentLabel = OPTIONS.find((opt) => opt.value === current)?.label ?? "Sort";

  return (
    <>
      <div className="relative hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900 sm:flex">
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

      <div className="relative sm:hidden" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          title={currentLabel}
          aria-label={currentLabel}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <ArrowUpDown className="size-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
            <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:border-slate-800 dark:text-slate-500">
              Sort by
            </div>
            <div className="p-1.5">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange(opt.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    opt.value === current
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  )}
                >
                  <span>{opt.label}</span>
                  {opt.value === current && <Check className="size-4" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
