import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { listAllUsers } from "@/lib/repos/users";
import { listAuditEvents } from "@/lib/repos/audit";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/box");

  const users = await listAllUsers();
  const withEvents = await Promise.all(
    users.map(async (u) => ({
      user: u,
      events: await listAuditEvents(u.id, 10),
    }))
  );

  const allEvents = withEvents
    .flatMap(({ user, events }) =>
      events.map((e) => ({ ...e, userName: user.displayName }))
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 100);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Activity</h1>

      {allEvents.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No activity recorded yet.
        </p>
      ) : (
        <div className="space-y-1">
          {allEvents.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5"
            >
              <span className="text-xs font-mono text-slate-400">
                {formatDate(e.createdAt)}
              </span>
              <span className="min-w-[90px] text-xs font-medium text-slate-600">
                {e.userName}
              </span>
              <span className="flex-1 text-xs text-slate-700">
                {e.eventType}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
