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
