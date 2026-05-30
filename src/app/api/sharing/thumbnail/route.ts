import sharp from "sharp";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { s3, S3_BUCKET } from "@/lib/aws/s3";
import { createPresignedPreviewUrl } from "@/lib/aws/presign";
import { getFileById } from "@/lib/repos/files";
import { getFamilyShare, getUserShare } from "@/lib/repos/family-shares";
import { isHeicLike, shouldGeneratePreview } from "@/lib/previews";
import heicDecode from "heic-decode";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ownerUserId = searchParams.get("owner");
  const fileId = searchParams.get("fileId");
  if (!ownerUserId || !fileId)
    return NextResponse.json({ error: "owner and fileId required" }, { status: 400 });

  const myId = session.user.id;
  const isOwner = ownerUserId === myId;
  if (!isOwner) {
    const [familyShare, userShare] = await Promise.all([
      getFamilyShare("file", fileId),
      getUserShare(myId, "file", fileId),
    ]);
    const share = familyShare ?? userShare;
    if (!share || share.ownerUserId !== ownerUserId)
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const file = await getFileById(ownerUserId, fileId);
  if (!file || !shouldGeneratePreview(file.mimeType, file.displayName))
    return NextResponse.json({ error: "Thumbnail not available" }, { status: 404 });

  if (!isHeicLike(file.displayName, file.mimeType)) {
    const url = await createPresignedPreviewUrl(file.s3Key);
    return NextResponse.redirect(url);
  }

  const object = await s3.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.s3Key,
    })
  );
  const body = object.Body as { transformToByteArray?: () => Promise<Uint8Array> } | undefined;
  if (!body?.transformToByteArray)
    return NextResponse.json({ error: "Could not load thumbnail" }, { status: 502 });

  const source = Buffer.from(await body.transformToByteArray());
  const preview = isHeicLike(file.displayName, file.mimeType)
    ? await convertHeicToJpeg(source)
    : await sharp(source)
        .rotate()
        .resize(320, 320, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();

  return new Response(new Uint8Array(preview), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const decoded = await heicDecode({ buffer });
  const image = Array.isArray(decoded) ? decoded[0] : decoded;
  if (!image) throw new Error("Could not decode HEIC image");

  const { width, height, data } = image;
  return sharp(Buffer.from(data), {
    raw: { width, height, channels: 4 },
  })
    .rotate()
    .resize(320, 320, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
}
