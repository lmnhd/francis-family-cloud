"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  currentName: string;
}

export function EditNameButton({ currentName }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed) { setError("Name cannot be empty"); return; }
    if (trimmed === currentName) { setEditing(false); return; }

    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: trimmed }),
    });

    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? "Could not save");
      return;
    }

    setEditing(false);
    setError("");
    router.refresh();
  };

  if (editing) {
    return (
      <div className="space-y-1">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setValue(currentName); setEditing(false); setError(""); }
          }}
          onBlur={save}
          className="w-full rounded border border-slate-300 bg-white px-1.5 py-0.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 text-left"
      title="Edit your name"
    >
      <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
        {currentName}
      </span>
      <Pencil className="size-3 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
    </button>
  );
}
