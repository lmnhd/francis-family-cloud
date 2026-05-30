import { NextResponse } from "next/server";
import { z } from "zod";
import { ulid } from "ulid";
import { auth } from "@/auth";
import { putS3Object } from "@/lib/aws/presign";
import { S3_BUCKET } from "@/lib/aws/s3";
import {
  downloadDropboxFile,
  getDropboxMetadata,
  getFreshDropboxAccessToken,
} from "@/lib/providers/dropbox";
import { getFolderById } from "@/lib/repos/folders";
import { buildS3Key, createImportedFileAvailable } from "@/lib/repos/files";
import { getProviderConnection } from "@/lib/repos/provider-connections";
import { writeAuditEvent } from "@/lib/repos/audit";

const MAX_IMPORT_BYTES = 100 * 1024 * 1024;

const schema = z.object({
  folderId: z.string().min(1),
  path: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const folder = await getFolderById(userId, parsed.data.folderId);
  if (!folder)
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });

  const connection = await getProviderConnection(userId, "dropbox");
  if (!connection)
    return NextResponse.json({ error: "Dropbox is not connected" }, { status: 409 });

  try {
    const accessToken = await getFreshDropboxAccessToken(connection);
    const metadata = await getDropboxMetadata(accessToken, parsed.data.path);

    if (metadata.tag !== "file") {
      return NextResponse.json({ error: "Only Dropbox files can be imported." }, { status: 400 });
    }

    if (typeof metadata.size === "number" && metadata.size > MAX_IMPORT_BYTES) {
      return NextResponse.json(
        { error: "Dropbox imports larger than 100 MB need the background importer." },
        { status: 413 }
      );
    }

    const download = await downloadDropboxFile(accessToken, parsed.data.path);

    if (download.body.byteLength > MAX_IMPORT_BYTES) {
      return NextResponse.json(
        { error: "Dropbox imports larger than 100 MB need the background importer." },
        { status: 413 }
      );
    }

    const fileId = ulid();
    const s3Key = buildS3Key(userId, fileId, download.metadata.name);
    const { etag } = await putS3Object({
      s3Key,
      body: download.body,
      mimeType: download.mimeType,
    });

    const file = await createImportedFileAvailable({
      fileId,
      ownerUserId: userId,
      folderId: folder.id,
      fileName: download.metadata.name,
      mimeType: download.mimeType,
      sizeBytes: download.body.byteLength,
      s3Bucket: S3_BUCKET,
      s3Key,
      etag,
      source: "dropbox",
      sourceProviderFileId: download.metadata.id,
    });

    await writeAuditEvent({
      targetUserId: userId,
      eventType: "import.dropbox.file",
      entityType: "file",
      entityId: file.id,
      metadata: {
        fileName: file.displayName,
        sizeBytes: file.sizeBytes,
        providerPath: parsed.data.path,
      },
    });

    return NextResponse.json({ file });
  } catch {
    return NextResponse.json({ error: "Could not import Dropbox file" }, { status: 502 });
  }
}
