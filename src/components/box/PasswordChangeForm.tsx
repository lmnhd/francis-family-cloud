"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PasswordChangeForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setBusy(false);

    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? "Something went wrong");
      return;
    }

    setSuccess(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        id="current"
        label="Current password"
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
      />
      <Field
        id="new"
        label="New password"
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        hint="At least 8 characters"
      />
      <Field
        id="confirm"
        label="Confirm new password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          Password changed successfully.
        </div>
      )}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
        {hint && (
          <span className="ml-2 font-normal text-slate-400 dark:text-slate-500">
            {hint}
          </span>
        )}
      </label>
      <input
        id={id}
        type="password"
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-slate-500"
      />
    </div>
  );
}
