import * as cdk from "aws-cdk-lib";
import * as backup from "aws-cdk-lib/aws-backup";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import type { StorageStack } from "./storage-stack";

interface DatabaseStackProps extends cdk.StackProps {
  storageStack: StorageStack;
}

export class DatabaseStack extends cdk.Stack {
  public readonly metadataTable: dynamodb.Table;
  public readonly appUser: iam.User;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Single-table design — see docs/05-data-model.md
    this.metadataTable = new dynamodb.Table(this, "FamilyCloudMetadata", {
      tableName: "francis-family-cloud",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI1 — byShareOwner: list a user's share links
    this.metadataTable.addGlobalSecondaryIndex({
      indexName: "byShareOwner",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2 — byFolder: browse folder contents sorted by display name
    this.metadataTable.addGlobalSecondaryIndex({
      indexName: "byFolder",
      partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3 — byFileStatus: trash view, pending uploads, failed items
    this.metadataTable.addGlobalSecondaryIndex({
      indexName: "byFileStatus",
      partitionKey: { name: "GSI3PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI3SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // IAM user for the Vercel app — scoped to this table and the S3 bucket only.
    this.appUser = new iam.User(this, "FamilyCloudAppUser", {
      userName: "francis-family-cloud-app",
    });

    const accessKey = new iam.AccessKey(this, "FamilyCloudAppAccessKey", {
      user: this.appUser,
    });

    this.appUser.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeTable",
        ],
        resources: [
          this.metadataTable.tableArn,
          `${this.metadataTable.tableArn}/index/*`,
        ],
      })
    );

    props.storageStack.bucket.grantReadWrite(this.appUser);

    // Store both access key ID and secret in Secrets Manager so they are
    // retrievable after deployment. Navigate to:
    //   Secrets Manager → francis-family-cloud/app-credentials
    new secretsmanager.Secret(this, "FamilyCloudAppCredentials", {
      secretName: "francis-family-cloud/app-credentials",
      description: "IAM access key for the francis-family-cloud-app user",
      secretObjectValue: {
        AWS_ACCESS_KEY_ID: cdk.SecretValue.unsafePlainText(
          accessKey.accessKeyId
        ),
        AWS_SECRET_ACCESS_KEY: accessKey.secretAccessKey,
        AWS_REGION: cdk.SecretValue.unsafePlainText(this.region),
        DYNAMODB_TABLE_NAME: cdk.SecretValue.unsafePlainText(
          this.metadataTable.tableName
        ),
        AWS_S3_BUCKET: cdk.SecretValue.unsafePlainText(
          props.storageStack.bucket.bucketName
        ),
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.CfnOutput(this, "FamilyCloudMetadataTableName", {
      value: this.metadataTable.tableName,
    });

    new cdk.CfnOutput(this, "FamilyCloudBucketName", {
      value: props.storageStack.bucket.bucketName,
    });

    new cdk.CfnOutput(this, "FamilyCloudAppAccessKeyId", {
      value: accessKey.accessKeyId,
    });

    new cdk.CfnOutput(this, "FamilyCloudCredentialsSecret", {
      value: "francis-family-cloud/app-credentials",
      description:
        "Secrets Manager path — retrieve all app env vars from here.",
    });

    // ── Weekly DynamoDB backup via AWS Backup ──────────────────────────
    const backupVault = new backup.BackupVault(this, "BackupVault", {
      backupVaultName: "francis-family-cloud-vault",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const backupPlan = new backup.BackupPlan(this, "BackupPlan", {
      backupPlanName: "francis-family-cloud-weekly",
    });

    backupPlan.addRule(
      new backup.BackupPlanRule({
        backupVault,
        ruleName: "WeeklyDynamoDB",
        scheduleExpression: events.Schedule.cron({
          weekDay: "SUN",
          hour: "3",
          minute: "0",
        }),
        deleteAfter: cdk.Duration.days(90),
      })
    );

    backupPlan.addSelection("DynamoDBTable", {
      resources: [backup.BackupResource.fromDynamoDbTable(this.metadataTable)],
      allowRestores: true,
    });
  }
}
