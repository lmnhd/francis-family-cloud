import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

// Singleton reused across warm Lambda/edge invocations.
export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const S3_BUCKET = env.AWS_S3_BUCKET;
