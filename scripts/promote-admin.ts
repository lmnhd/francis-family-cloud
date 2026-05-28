/**
 * Promote an existing family member to admin role.
 *
 * Usage (PowerShell):
 *   $env:ADMIN_NAME = "Angela"; npm run promote-admin
 *
 * Run this once after seeding to give yourself admin access.
 * Then sign in as that person and use /admin/users to manage the rest.
 */

import { GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../src/lib/aws/ddb";

async function main() {
  const TARGET_NAME = process.env.ADMIN_NAME;

  if (!TARGET_NAME) {
    console.error("Set ADMIN_NAME before running.");
    console.error('PowerShell: $env:ADMIN_NAME = "Angela"; npm run promote-admin');
    process.exit(1);
  }

  // Look up the userId from the roster anchor
  const rosterResult = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": "ROSTER#ACTIVE",
        ":sk": `USER#${TARGET_NAME.toLowerCase()}`,
      },
    })
  );

  if (!rosterResult.Items?.length) {
    console.error(`No active user found with display name "${TARGET_NAME}".`);
    console.error("Make sure you have run the seed script first.");
    process.exit(1);
  }

  const { userId } = rosterResult.Items[0];

  // Verify the profile exists
  const profile = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
    })
  );

  if (!profile.Item) {
    console.error(`User profile not found for "${TARGET_NAME}" (id: ${userId}).`);
    process.exit(1);
  }

  // Promote to admin
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      UpdateExpression: "SET #role = :admin, updatedAt = :now",
      ExpressionAttributeNames: { "#role": "role" },
      ExpressionAttributeValues: {
        ":admin": "admin",
        ":now": new Date().toISOString(),
      },
    })
  );

  console.log(`✓ ${TARGET_NAME} (${userId}) is now an admin.`);
  console.log(`Sign in as ${TARGET_NAME}, then go to /admin/users to manage the family roster.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
