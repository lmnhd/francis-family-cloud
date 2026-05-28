"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

interface Props {
  fileId: string;
}

export function RestoreButton({ fileId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleRestore = async () => {
    setBusy(true);
    await fetch(`/api/files/${fileId}/restore`, { method: "POST" });
    setBusy(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleRestore}
      disabled={busy}
      title="Restore"
      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
    >
      <RotateCcw className="size-3.5" />
    </button>
  );
}
