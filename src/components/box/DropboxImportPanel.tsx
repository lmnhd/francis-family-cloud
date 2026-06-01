"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cloud, FileDown, Folder, Loader2, Unplug } from "lucide-react";
import { formatBytes } from "@/lib/format";

interface DropboxEntry {
  id: string;
  tag: "file" | "folder";
  name: string;
  pathDisplay?: string;
  size?: number;
}

interface Props {
  connected: boolean;
  defaultFolderId: string;
}

export function DropboxImportPanel({ connected, defaultFolderId }: Props) {
  const router = useRouter();
  const [path, setPath] = useState("");
  const [entries, setEntries] = useState<DropboxEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFolder = useCallback((dropboxPath: string, onCancel: () => boolean) => {
    setLoading(true);
    setError(null);

    fetch(`/api/imports/dropbox/list?path=${encodeURIComponent(dropboxPath)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Could not list Dropbox" }));
          throw new Error(data.error);
        }
        return res.json();
      })
      .then((data) => {
        if (!onCancel()) setEntries(data.entries ?? []);
      })
      .catch((err) => {
        if (!onCancel()) setError(err instanceof Error ? err.message : "Could not list Dropbox");
      })
      .finally(() => {
        if (!onCancel()) setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!connected) return;

    let cancelled = false;
    queueMicrotask(() => loadFolder(path, () => cancelled));

    return () => {
      cancelled = true;
    };
  }, [connected, loadFolder, path]);

  async function importFile(entry: DropboxEntry) {
    const importPath = entry.pathDisplay;
    if (!importPath) return;

    setBusyPath(importPath);
    setError(null);
    try {
      const res = await fetch("/api/imports/dropbox/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: defaultFolderId, path: importPath }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Import failed" }));
        throw new Error(data.error);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusyPath(null);
    }
  }

  async function disconnect() {
    await fetch("/api/imports/dropbox/disconnect", { method: "POST" });
    router.refresh();
  }

  if (!connected) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <Cloud className="mt-0.5 size-5 text-slate-400" />
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Dropbox</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Connect once, pick files, and copy them into your box.
            </p>
            <a
              href="/api/imports/dropbox/connect"
              className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Connect Dropbox
            </a>
          </div>
        </div>
      </section>
    );
  }

  const crumbs = path.split("/").filter(Boolean);

  return (
    <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Dropbox</h2>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <button type="button" onClick={() => setPath("")} className="hover:text-slate-900 dark:hover:text-slate-100">
              Dropbox
            </button>
            {crumbs.map((crumb, index) => {
              const crumbPath = `/${crumbs.slice(0, index + 1).join("/")}`;
              return (
                <span key={crumbPath} className="flex items-center gap-1">
                  <span>/</span>
                  <button type="button" onClick={() => setPath(crumbPath)} className="hover:text-slate-900 dark:hover:text-slate-100">
                    {crumb}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={disconnect}
          title="Disconnect Dropbox"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Unplug className="size-4" />
        </button>
      </div>

      {error && (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" />
            Loading Dropbox
          </div>
        ) : entries.length === 0 ? (
          <p className="p-4 text-sm text-slate-500 dark:text-slate-400">This Dropbox folder is empty.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
              {entry.tag === "folder" ? (
                <Folder className="size-5 text-slate-400" />
              ) : (
                <FileDown className="size-5 text-slate-400" />
              )}
              <button
                type="button"
                onClick={() => entry.tag === "folder" && entry.pathDisplay && setPath(entry.pathDisplay)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                  {entry.name}
                </span>
                {entry.tag === "file" && typeof entry.size === "number" && (
                  <span className="text-xs text-slate-400">{formatBytes(entry.size)}</span>
                )}
              </button>
              {entry.tag === "file" && (
                <button
                  type="button"
                  disabled={busyPath === entry.pathDisplay}
                  onClick={() => importFile(entry)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {busyPath === entry.pathDisplay ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      Copying
                    </span>
                  ) : (
                    "Import"
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
