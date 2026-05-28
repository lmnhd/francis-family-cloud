import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET } from "@/lib/aws/s3";

export async function createPresignedUploadUrl(params: {
  s3Key: string;
  mimeType: string;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: params.s3Key,
    ContentType: params.mimeType,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function createPresignedDownloadUrl(
  s3Key: string,
  fileName: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  });
  return getSignedUrl(s3, command, { expiresIn: 900 });
}

export async function headS3Object(
  s3Key: string
): Promise<{ sizeBytes: number; etag: string } | null> {
  try {
    const result = await s3.send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: s3Key })
    );
    return {
      sizeBytes: result.ContentLength ?? 0,
      etag: (result.ETag ?? "").replace(/"/g, ""),
    };
  } catch {
    return null;
  }
}
