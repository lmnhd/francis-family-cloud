"use client";

import { useEffect, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import type { FileRecord } from "@/lib/repos/files";

interface Props {
  file: FileRecord;
  onClose: () => void;
}

export function ShareModal({ file, onClose }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetch(`/api/files/${file.id}/share`, { method: "POST" })
      .then((r) => r.json())
      .then(({ shareToken }) => setToken(shareToken))
      .finally(() => setLoading(false));
  }, [file.id]);

  const shareUrl = token
    ? `${window.location.origin}/s/${token}`
    : null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!token) return;
    setRevoking(true);
    await fetch(`/api/files/${file.id}/share?token=${token}`, {
      method: "DELETE",
    });
    setToken(null);
    setRevoking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Share file</h2>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {file.displayName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading && (
          <p className="py-4 text-center text-sm text-slate-400">
            Creating link…
          </p>
        )}

        {!loading && shareUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="flex-1 truncate text-xs text-slate-600">
                {shareUrl}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-200"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Link expires in 7 days. Anyone with it can preview and download
              this file.
            </p>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="w-full rounded-lg border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {revoking ? "Revoking…" : "Revoke link"}
            </button>
          </div>
        )}

        {!loading && !shareUrl && (
          <p className="py-4 text-center text-sm text-slate-500">
            Link revoked.
          </p>
        )}
      </div>
    </div>
  );
}
