import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET } from "@/lib/aws/s3";

export const PART_SIZE = 10 * 1024 * 1024; // 10 MB per chunk
export const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // switch to multipart above 100 MB

// ── Single-part ───────────────────────────────────────────────────────────────

export async function createPresignedUploadUrl(params: {
  s3Key: string;
  mimeType: string;
}): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: params.s3Key,
      ContentType: params.mimeType,
    }),
    { expiresIn: 3600 }
  );
}

// ── Multipart ─────────────────────────────────────────────────────────────────

export async function initMultipartUpload(
  s3Key: string,
  mimeType: string,
  partCount: number
): Promise<{ uploadId: string; partUrls: string[] }> {
  const { UploadId } = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      ContentType: mimeType,
    })
  );

  if (!UploadId) throw new Error("S3 did not return an UploadId");

  // Pre-sign every part URL up front. getSignedUrl is pure crypto — no S3 API calls.
  const partUrls = await Promise.all(
    Array.from({ length: partCount }, (_, i) =>
      getSignedUrl(
        s3,
        new UploadPartCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
          UploadId,
          PartNumber: i + 1,
        }),
        { expiresIn: 7200 } // 2 h — generous window for slow connections
      )
    )
  );

  return { uploadId: UploadId, partUrls };
}

export async function completeMultipartUpload(
  s3Key: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[]
): Promise<void> {
  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map(({ partNumber, etag }) => ({
          PartNumber: partNumber,
          ETag: etag,
        })),
      },
    })
  );
}

// ── Download / preview / head ─────────────────────────────────────────────────

export async function createPresignedDownloadUrl(
  s3Key: string,
  fileName: string
): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }),
    { expiresIn: 900 }
  );
}

export async function createPresignedPreviewUrl(s3Key: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }),
    { expiresIn: 3600 }
  );
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
