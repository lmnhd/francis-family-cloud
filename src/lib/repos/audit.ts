import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";

export interface AuditEvent {
  eventType: AuditEventType;
  actorUserId: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type AuditEventType =
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.login.rate_limited"
  | "auth.logout"
  | "file.upload.complete"
  | "file.download"
  | "file.delete"
  | "file.restore"
  | "share.create"
  | "share.revoke"
  | "share.access"
  | "admin.user.create"
  | "admin.user.disable"
  | "admin.user.enable"
  | "admin.user.password_reset";

export async function writeAuditEvent(params: {
  targetUserId: string;
  actorUserId?: string;
  eventType: AuditEventType;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const now = new Date().toISOString();
  const eventId = ulid();

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${params.targetUserId}`,
        SK: `AUDIT#${now}#${eventId}`,
        actorUserId: params.actorUserId ?? params.targetUserId,
        eventType: params.eventType,
        entityType: params.entityType ?? "user",
        entityId: params.entityId ?? params.targetUserId,
        ...(params.metadata
          ? { metadataJson: JSON.stringify(params.metadata) }
          : {}),
        createdAt: now,
      },
    })
  );
}

export async function listAuditEvents(
  userId: string,
  limit = 50
): Promise<AuditEvent[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":prefix": "AUDIT#",
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (result.Items ?? []).map((item) => ({
    eventType: item.eventType as AuditEventType,
    actorUserId: item.actorUserId as string,
    entityType: item.entityType as string,
    entityId: item.entityId as string,
    createdAt: item.createdAt as string,
    ...(item.metadataJson
      ? {
          metadata: JSON.parse(item.metadataJson as string) as Record<
            string,
            unknown
          >,
        }
      : {}),
  }));
}
