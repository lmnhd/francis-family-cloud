import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { listAllUsers } from "@/lib/repos/users";
import { getUserStorageBytes } from "@/lib/repos/files";
import { formatBytes } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminStoragePage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/box");

  const users = await listAllUsers();
  const withStorage = await Promise.all(
    users.map(async (u) => ({
      ...u,
      storageBytes: await getUserStorageBytes(u.id),
    }))
  );
  const sorted = [...withStorage].sort((a, b) => b.storageBytes - a.storageBytes);
  const total = sorted.reduce((sum, u) => sum + u.storageBytes, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Storage</h1>
        <p className="text-sm text-slate-500">Total: {formatBytes(total)}</p>
      </div>

      <div className="space-y-1.5">
        {sorted.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">
                {u.displayName}
              </p>
              <p className="text-xs text-slate-400">
                {u.role} {u.disabledAt ? "· disabled" : ""}
              </p>
            </div>
            <p className="text-sm font-medium text-slate-700">
              {formatBytes(u.storageBytes)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
