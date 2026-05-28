import * as cdk from "aws-cdk-lib";
import { StorageStack } from "../lib/storage-stack";
import { DatabaseStack } from "../lib/database-stack";

const app = new cdk.App();

const storageStack = new StorageStack(app, "FrancisFamilyCloudStorageStack", {
  description: "Private S3 bucket for Francis Family Cloud",
});

new DatabaseStack(app, "FrancisFamilyCloudDatabaseStack", {
  description:
    "DynamoDB single-table metadata store and IAM app user for Francis Family Cloud",
  storageStack,
});
