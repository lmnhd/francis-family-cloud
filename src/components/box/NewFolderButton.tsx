"use client";

import { useState, useRef, useEffect } from "react";
import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  parentFolderId: string;
}

export function NewFolderButton({ parentFolderId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setOpen(false); return; }
    setBusy(true);
    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, parentFolderId }),
    });
    setBusy(false);
    setName("");
    setOpen(false);
    router.refresh();
  };

  if (open) {
    return (
      <form
        onSubmit={(e) => { e.preventDefault(); create(); }}
        className="flex items-center gap-2"
      >
        <FolderPlus className="size-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setName(""); } }}
          onBlur={() => { if (!name.trim()) { setOpen(false); } }}
          placeholder="Folder name"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {busy ? "Creating…" : "Create"}
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    >
      <FolderPlus className="size-4" />
      New folder
    </button>
  );
}
