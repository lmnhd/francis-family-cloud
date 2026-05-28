import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Folder, Users } from "lucide-react";
import Link from "next/link";
import {
  listAllFamilyShares,
  listSharesWithMe,
} from "@/lib/repos/family-shares";
import { formatBytes, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const myId = session.user.id;

  const [familyShares, sharedWithMe] = await Promise.all([
    listAllFamilyShares(),
    listSharesWithMe(myId),
  ]);

  // Family shares visible to me (exclude my own — I can see those in My Box)
  const othersFamily = familyShares.filter((s) => s.ownerUserId !== myId);
  const myFamily = familyShares.filter((s) => s.ownerUserId === myId);
  const files = othersFamily.filter((s) => s.type === "file");
  const folders = othersFamily.filter((s) => s.type === "folder");
  const myFiles = myFamily.filter((s) => s.type === "file");
  const myFolders = myFamily.filter((s) => s.type === "folder");

  const sharedFiles = sharedWithMe.filter((s) => s.type === "file");
  const sharedFolders = sharedWithMe.filter((s) => s.type === "folder");

  const totalItems = othersFamily.length + sharedWithMe.length;

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="flex items-center gap-2 py-5">
            <Users className="size-5 text-slate-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Family
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-6">
          {totalItems === 0 && myFamily.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
              <Users className="mx-auto mb-3 size-8 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                Nothing shared yet.
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                Share files or folders from your box and they will appear here for the family.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Shared by others with all family */}
              {(files.length > 0 || folders.length > 0) && (
                <Section title="Shared with everyone">
                  {folders.map((s) => (
                    <SharedFolderRow key={s.resourceId} share={s} />
                  ))}
                  {files.map((s) => (
                    <SharedFileRow key={s.resourceId} share={s} />
                  ))}
                </Section>
              )}

              {/* Shared specifically with me */}
              {(sharedFiles.length > 0 || sharedFolders.length > 0) && (
                <Section title="Shared with you">
                  {sharedFolders.map((s) => (
                    <SharedFolderRow key={s.resourceId} share={s} />
                  ))}
                  {sharedFiles.map((s) => (
                    <SharedFileRow key={s.resourceId} share={s} />
                  ))}
                </Section>
              )}

              {/* My own shared content */}
              {(myFiles.length > 0 || myFolders.length > 0) && (
                <Section title="Shared by you">
                  {myFolders.map((s) => (
                    <SharedFolderRow key={s.resourceId} share={s} myOwn />
                  ))}
                  {myFiles.map((s) => (
                    <SharedFileRow key={s.resourceId} share={s} myOwn />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function SharedFileRow({ share, myOwn }: { share: ReturnType<typeof Object.assign>; myOwn?: boolean }) {
  const downloadUrl = `/api/sharing/download?owner=${share.ownerUserId}&fileId=${share.resourceId}`;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <span className="text-xl">
        {share.mimeType?.startsWith("image/") ? "🖼" : share.mimeType?.startsWith("video/") ? "🎬" : "📄"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{share.displayName}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {share.sizeBytes ? formatBytes(share.sizeBytes) : ""} · {formatDate(share.sharedAt)}
          {myOwn && " · shared by you"}
        </p>
      </div>
      {!myOwn && (
        <a
          href={downloadUrl}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Download
        </a>
      )}
      {myOwn && (
        <Link
          href="/box"
          className="shrink-0 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          View in box →
        </Link>
      )}
    </div>
  );
}

function SharedFolderRow({ share, myOwn }: { share: ReturnType<typeof Object.assign>; myOwn?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <Folder className="size-5 shrink-0 text-slate-400 dark:text-slate-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{share.displayName}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Folder · {formatDate(share.sharedAt)}
          {myOwn && " · shared by you"}
        </p>
      </div>
      {!myOwn && (
        <Link
          href={`/box/family/folder/${share.ownerUserId}/${share.resourceId}`}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Open →
        </Link>
      )}
    </div>
  );
}
