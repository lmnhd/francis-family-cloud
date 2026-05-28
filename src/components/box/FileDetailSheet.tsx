"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileIcon,
  FolderInput,
  Link2,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { FileRecord } from "@/lib/repos/files";
import { formatBytes, formatDate } from "@/lib/format";
import { ShareModal } from "./ShareModal";
import { MoveModal } from "./MoveModal";
import { FamilyShareModal } from "./FamilyShareModal";

interface Props {
  file: FileRecord;
  onClose: () => void;
}

export function FileDetailSheet({ file, onClose }: Props) {
  const router = useRouter();
  const [showShare, setShowShare] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showFamilyShare, setShowFamilyShare] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.displayName);
  const [busy, setBusy] = useState(false);

  const handleDownload = () => {
    window.location.href = `/api/files/${file.id}/download`;
    onClose();
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === file.displayName) {
      setRenaming(false);
      return;
    }
    setBusy(true);
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: newName.trim() }),
    });
    setBusy(false);
    setRenaming(false);
    onClose();
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${file.displayName}"? It will move to trash.`)) return;
    setBusy(true);
    await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    setBusy(false);
    onClose();
    router.refresh();
  };

  if (showShare)
    return <ShareModal file={file} onClose={() => { setShowShare(false); onClose(); }} />;
  if (showMove)
    return <MoveModal file={file} onClose={() => { setShowMove(false); onClose(); }} />;
  if (showFamilyShare)
    return <FamilyShareModal type="file" resourceId={file.id} displayName={file.displayName} onClose={() => { setShowFamilyShare(false); onClose(); }} />;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-slate-200 bg-white pb-safe dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile only) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-4 py-4">
          <FileIcon className="mt-0.5 size-5 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            {renaming ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleRename(); }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900"
                >
                  Save
                </button>
                <button type="button" onClick={() => { setRenaming(false); setNewName(file.displayName); }}>
                  <X className="size-4 text-slate-400" />
                </button>
              </form>
            ) : (
              <p className="font-medium text-slate-900 dark:text-slate-100 break-all">
                {file.displayName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Metadata */}
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <dl className="space-y-1.5 text-sm">
            <MetaRow label="Size" value={formatBytes(file.sizeBytes)} />
            <MetaRow label="Modified" value={formatDate(file.updatedAt)} />
            <MetaRow label="Added" value={formatDate(file.createdAt)} />
            <MetaRow label="Type" value={file.mimeType} />
          </dl>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              icon={<Download className="size-4" />}
              label="Download"
              onClick={handleDownload}
            />
            <ActionButton
              icon={<Link2 className="size-4" />}
              label="Share link"
              onClick={() => setShowShare(true)}
            />
            <ActionButton
              icon={<FolderInput className="size-4" />}
              label="Move to…"
              onClick={() => setShowMove(true)}
            />
            <ActionButton
              icon={<Pencil className="size-4" />}
              label="Rename"
              onClick={() => setRenaming(true)}
            />
            <ActionButton
              icon={<Users className="size-4" />}
              label="Family sharing"
              onClick={() => setShowFamilyShare(true)}
            />
          </div>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="size-4" />
            Move to trash
          </button>
        </div>

        {/* Safe area spacer for iOS */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-20 shrink-0 text-xs text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="truncate text-slate-700 dark:text-slate-300">{value}</dd>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {icon}
      {label}
    </button>
  );
}
