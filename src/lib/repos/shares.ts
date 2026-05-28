import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";

export interface ShareLink {
  id: string;
  fileId: string;
  ownerUserId: string;
  shareToken: string;
  expiresAt: string;
  allowPreview: boolean;
  allowDownload: boolean;
  revokedAt?: string;
  lastAccessedAt?: string;
  createdAt: string;
}

export async function createShareLink(params: {
  fileId: string;
  ownerUserId: string;
  expiresInDays?: number;
}): Promise<ShareLink> {
  const now = new Date().toISOString();
  const token = ulid();
  const shareId = ulid();
  const days = params.expiresInDays ?? 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const item = {
    PK: `SHARE#${token}`,
    SK: "META",
    id: shareId,
    fileId: params.fileId,
    ownerUserId: params.ownerUserId,
    shareToken: token,
    expiresAt,
    allowPreview: true,
    allowDownload: true,
    createdAt: now,
    GSI1PK: `USER#${params.ownerUserId}`,
    GSI1SK: `SHARE#${now}`,
  };

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return itemToShareLink(item);
}

export async function getShareLink(token: string): Promise<ShareLink | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `SHARE#${token}`, SK: "META" },
    })
  );
  return result.Item ? itemToShareLink(result.Item) : null;
}

export async function revokeShareLink(token: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `SHARE#${token}`, SK: "META" },
      UpdateExpression: "SET revokedAt = :now",
      ExpressionAttributeValues: { ":now": new Date().toISOString() },
    })
  );
}

export async function recordShareAccess(token: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `SHARE#${token}`, SK: "META" },
      UpdateExpression: "SET lastAccessedAt = :now",
      ExpressionAttributeValues: { ":now": new Date().toISOString() },
    })
  );
}

export async function listUserShareLinks(
  userId: string
): Promise<ShareLink[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "byShareOwner",
      KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :prefix)",
      FilterExpression: "attribute_not_exists(revokedAt)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":prefix": "SHARE#",
      },
      ScanIndexForward: false,
    })
  );
  return (result.Items ?? []).map(itemToShareLink);
}

export function isShareLinkValid(link: ShareLink): boolean {
  if (link.revokedAt) return false;
  if (new Date(link.expiresAt) < new Date()) return false;
  return true;
}

function itemToShareLink(item: Record<string, unknown>): ShareLink {
  return {
    id: item.id as string,
    fileId: item.fileId as string,
    ownerUserId: item.ownerUserId as string,
    shareToken: item.shareToken as string,
    expiresAt: item.expiresAt as string,
    allowPreview: item.allowPreview as boolean,
    allowDownload: item.allowDownload as boolean,
    createdAt: item.createdAt as string,
    ...(item.revokedAt ? { revokedAt: item.revokedAt as string } : {}),
    ...(item.lastAccessedAt
      ? { lastAccessedAt: item.lastAccessedAt as string }
      : {}),
  };
}
