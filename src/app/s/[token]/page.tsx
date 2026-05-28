import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { getShareLink, isShareLinkValid, recordShareAccess } from "@/lib/repos/shares";
import { getFileById } from "@/lib/repos/files";
import { createPresignedDownloadUrl } from "@/lib/aws/presign";
import { formatBytes } from "@/lib/format";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const link = await getShareLink(token);
  if (!link || !isShareLinkValid(link)) notFound();

  // Ownership check: look up file by ownerUserId + fileId
  const file = await getFileById(link.ownerUserId, link.fileId);
  if (!file || file.status !== "available") notFound();

  await recordShareAccess(token);

  const downloadUrl = await createPresignedDownloadUrl(
    file.s3Key,
    file.displayName
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f0ea] px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Francis Family Cloud
        </p>
        <h1 className="mb-1 truncate text-xl font-semibold text-slate-900">
          {file.displayName}
        </h1>
        <p className="mb-6 text-sm text-slate-500">{formatBytes(file.sizeBytes)}</p>

        <a
          href={downloadUrl}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Download className="size-4" />
          Download
        </a>

        <p className="mt-4 text-center text-xs text-slate-400">
          Link expires {new Date(link.expiresAt).toLocaleDateString()}
        </p>
      </div>
    </main>
  );
}
