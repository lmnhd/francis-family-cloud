# AWS Setup

This folder holds the two supported infrastructure paths for Francis Family Cloud:

- `cli/` for direct AWS CLI commands and one-off operational tasks
- `cdk/` for reproducible infrastructure as code

Use the AWS CLI path for quick bucket checks, manual object inspection, and short-lived fixes.
Use CDK when you want the S3 and optional DynamoDB resources defined in source control.

