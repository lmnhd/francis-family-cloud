"use client";

import { useEffect, useState } from "react";
import { Users, User, X, CheckCircle2 } from "lucide-react";
import type { ShareType } from "@/lib/repos/family-shares";

interface RosterEntry {
  userId: string;
  displayName: string;
}

interface Props {
  type: ShareType;
  resourceId: string;
  displayName: string;
  onClose: () => void;
}

export function FamilyShareModal({ type, resourceId, displayName, onClose }: Props) {
  const [familyShared, setFamilyShared] = useState(false);
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/sharing?type=${type}&resourceId=${resourceId}`).then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([status, usersData]) => {
      setFamilyShared(status.familyShared);
      setSharedWithUserIds(status.sharedWithUserIds ?? []);
      setRoster(usersData.users ?? []);
    }).finally(() => setLoading(false));
  }, [type, resourceId]);

  const post = async (scope: "family" | "user", enabled: boolean, targetUserId?: string) => {
    await fetch("/api/sharing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, resourceId, scope, enabled, targetUserId }),
    });
  };

  const toggleFamily = async () => {
    const next = !familyShared;
    setSaving(true);
    await post("family", next);
    setFamilyShared(next);
    setSaving(false);
    flashSaved();
  };

  const toggleUser = async (userId: string) => {
    const isShared = sharedWithUserIds.includes(userId);
    setSaving(true);
    await post("user", !isShared, userId);
    setSharedWithUserIds((prev) =>
      isShared ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
    setSaving(false);
    flashSaved();
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Family sharing
            </h2>
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
              {displayName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="space-y-1 p-3">
            {/* All family toggle */}
            <ShareRow
              icon={<Users className="size-4" />}
              label="All family members"
              description="Everyone who signs in can view this"
              checked={familyShared}
              onToggle={toggleFamily}
              disabled={saving}
            />

            {/* Individual member toggles */}
            {roster.length > 0 && (
              <>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <p className="px-3 py-1 text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Or share with specific people
                </p>
                {roster.map((u) => (
                  <ShareRow
                    key={u.userId}
                    icon={<User className="size-4" />}
                    label={u.displayName}
                    checked={sharedWithUserIds.includes(u.userId)}
                    onToggle={() => toggleUser(u.userId)}
                    disabled={saving || familyShared}
                    dimmed={familyShared}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          {saved ? (
            <p className="flex items-center justify-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" /> Saved
            </p>
          ) : (
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareRow({
  icon,
  label,
  description,
  checked,
  onToggle,
  disabled,
  dimmed,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  dimmed?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed dark:hover:bg-slate-800 ${dimmed ? "opacity-40" : ""}`}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {description && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
        )}
      </div>
      {/* Toggle */}
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          checked
            ? "border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-400"
            : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="size-3 fill-current">
            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
