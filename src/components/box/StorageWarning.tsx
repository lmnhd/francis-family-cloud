import { AlertTriangle } from "lucide-react";
import { formatBytes } from "@/lib/format";

interface Props {
  usedBytes: number;
  limitBytes: number;
}

export function StorageWarning({ usedBytes, limitBytes }: Props) {
  const pct = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  if (pct < 80) return null;

  const isOver = pct >= 100;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        isOver
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">
          {isOver
            ? "Your box is full"
            : `Your box is ${pct}% full`}
        </p>
        <p className="text-xs opacity-80">
          {formatBytes(usedBytes)} used of {formatBytes(limitBytes)}.
          {isOver
            ? " Delete some files to free up space."
            : " Consider removing files you no longer need."}
        </p>
      </div>
    </div>
  );
}
