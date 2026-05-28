# AWS CLI Notes

Use the AWS CLI for direct S3 and DynamoDB work when you do not want to deploy the CDK stack.

Expected environment variables:

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` if you are using temporary credentials

Suggested first commands:

```bash
aws s3 ls
aws s3api list-buckets
aws s3api create-bucket --bucket <bucket-name> --region <region>
aws dynamodb list-tables
```

