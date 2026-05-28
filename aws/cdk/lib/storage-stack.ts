import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "FamilyCloudBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      // Allow browsers to PUT files via presigned URLs from any origin.
      // CORS doesn't bypass S3 auth — presigned URLs still require valid signatures.
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          // Abort incomplete multipart uploads to avoid orphaned storage costs.
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          // Permanently delete objects marked for hard-delete after retention window.
          // Objects are tagged "retain-until" by the cleanup cron job.
          tagFilters: { "cleanup-eligible": "true" },
          expiration: cdk.Duration.days(1),
        },
      ],
    });

    new cdk.CfnOutput(this, "FamilyCloudBucketName", {
      value: this.bucket.bucketName,
    });
  }
}
