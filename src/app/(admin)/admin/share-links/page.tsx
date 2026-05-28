import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { listAllUsers } from "@/lib/repos/users";
import { listUserShareLinks, isShareLinkValid } from "@/lib/repos/shares";
import { getFileById } from "@/lib/repos/files";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminShareLinksPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/box");

  const users = await listAllUsers();
  const perUser = await Promise.all(
    users.map(async (u) => {
      const links = await listUserShareLinks(u.id);
      const withFiles = await Promise.all(
        links.filter(isShareLinkValid).map(async (link) => ({
          link,
          file: await getFileById(u.id, link.fileId),
          userName: u.displayName,
        }))
      );
      return withFiles;
    })
  );

  const active = perUser
    .flat()
    .filter((r) => r.file)
    .sort(
      (a, b) =>
        new Date(b.link.createdAt).getTime() -
        new Date(a.link.createdAt).getTime()
    );

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">
        Active Share Links
      </h1>

      {active.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No active share links.
        </p>
      ) : (
        <div className="space-y-1.5">
          {active.map(({ link, file, userName }) => (
            <div
              key={link.shareToken}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {file?.displayName}
                </p>
                <p className="text-xs text-slate-400">
                  {userName} · Expires {formatDate(link.expiresAt)}
                </p>
              </div>
              <a
                href={`/s/${link.shareToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs text-blue-600 hover:underline"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
