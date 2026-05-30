"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function BoxError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              The box is having trouble reaching storage
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              We couldn&apos;t load your folders and files just now. This usually means the
              network or AWS connection is having a bad moment. Try again in a few seconds.
            </p>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              If this keeps happening, check the local network and AWS credentials used by the app.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <RefreshCcw className="size-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
