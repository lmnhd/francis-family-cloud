import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { s3, S3_BUCKET } from "@/lib/aws/s3";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = await Promise.allSettled([
    ddb.send(new DescribeTableCommand({ TableName: TABLE_NAME })),
    s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET })),
  ]);

  const [ddbCheck, s3Check] = checks;

  const result = {
    dynamodb: ddbCheck.status === "fulfilled" ? "ok" : "error",
    s3: s3Check.status === "fulfilled" ? "ok" : "error",
    ...(ddbCheck.status === "rejected"
      ? { dynamodb_error: String(ddbCheck.reason) }
      : {}),
    ...(s3Check.status === "rejected"
      ? { s3_error: String(s3Check.reason) }
      : {}),
  };

  const allOk = ddbCheck.status === "fulfilled" && s3Check.status === "fulfilled";

  return NextResponse.json(result, { status: allOk ? 200 : 503 });
}
