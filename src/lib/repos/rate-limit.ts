import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `LOGIN_ATTEMPT#${userId}`, SK: "COUNT" },
    })
  );

  const attempts = (result.Item?.attempts as number | undefined) ?? 0;
  return {
    allowed: attempts < MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - attempts),
  };
}

export async function incrementLoginAttempt(userId: string): Promise<void> {
  const ttl = Math.floor(Date.now() / 1000) + WINDOW_SECONDS;
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `LOGIN_ATTEMPT#${userId}`, SK: "COUNT" },
      // Set TTL only on first write so the window resets from the first bad attempt.
      UpdateExpression:
        "ADD attempts :one SET #ttl = if_not_exists(#ttl, :ttl)",
      ExpressionAttributeNames: { "#ttl": "ttl" },
      ExpressionAttributeValues: { ":one": 1, ":ttl": ttl },
    })
  );
}

export async function resetLoginAttempts(userId: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `LOGIN_ATTEMPT#${userId}`, SK: "COUNT" },
      UpdateExpression: "SET attempts = :zero",
      ExpressionAttributeValues: { ":zero": 0 },
    })
  );
}
