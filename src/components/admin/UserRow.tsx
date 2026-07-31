"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/repos/users";

interface Props {
  user: Omit<User, "passwordHash">;
  currentAdminId: string;
}

export function UserRow({ user, currentAdminId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  };

  const isSelf = user.id === currentAdminId;
  const isDisabled = !!user.disabledAt;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">
            {user.displayName}
            {isSelf && (
              <span className="ml-2 text-xs text-slate-400">(you)</span>
            )}
          </p>
          <p className="text-xs text-slate-400">
            {user.role}
            {isDisabled && " · disabled"}
            {user.email && ` · ${user.email}`}
          </p>
        </div>

        {!isSelf && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setShowReset((v) => !v)}
              disabled={busy}
              className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            >
              Reset password
            </button>
            {isDisabled ? (
              <button
                onClick={() => patch({ action: "enable" })}
                disabled={busy}
                className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Enable
              </button>
            ) : (
              <button
                onClick={() => patch({ action: "disable" })}
                disabled={busy}
                className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
              >
                Disable
              </button>
            )}
          </div>
        )}
      </div>

      {showReset && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (newPassword.length < 8) return;
            await patch({ action: "reset-password", newPassword });
            setShowReset(false);
            setNewPassword("");
          }}
          className="mt-3 flex gap-2"
        >
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            minLength={8}
            required
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
}
