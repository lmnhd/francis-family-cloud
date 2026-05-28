import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";

export interface RosterEntry {
  userId: string;
  displayName: string;
}

export async function listActiveRoster(): Promise<RosterEntry[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": "ROSTER#ACTIVE",
        ":prefix": "USER#",
      },
    })
  );

  return (result.Items ?? []).map((item) => ({
    userId: item.userId as string,
    displayName: item.displayName as string,
  }));
}
