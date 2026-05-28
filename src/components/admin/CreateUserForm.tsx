"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: data.get("displayName"),
        password: data.get("password"),
        role: data.get("role"),
        email: data.get("email") || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? "Something went wrong");
      return;
    }
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700"
      >
        + Add family member
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
    >
      <h2 className="text-sm font-semibold text-slate-800">New family member</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-600">Display name</label>
          <input
            name="displayName"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Role</label>
          <select
            name="role"
            defaultValue="member"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-600">
            Initial password
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">
            Email (optional)
          </label>
          <input
            name="email"
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}
