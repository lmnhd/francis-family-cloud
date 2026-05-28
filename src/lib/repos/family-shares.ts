import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";

export type ShareType = "file" | "folder";
export type ShareScope = "family" | "user";

export interface ShareRecord {
  ownerUserId: string;
  type: ShareType;
  resourceId: string;
  displayName: string;
  // File-specific (pre-stored to avoid re-fetching on listing)
  mimeType?: string;
  sizeBytes?: number;
  s3Key?: string;
  sharedAt: string;
}

// ── Family-wide shares (visible to all logged-in members) ─────────────────────
// PK: SHARE#FAMILY  SK: FILE#<id> | FOLDER#<id>

function familyPK() { return "SHARE#FAMILY"; }
function resourceSK(type: ShareType, id: string) { return `${type.toUpperCase()}#${id}`; }

export async function createFamilyShare(params: {
  ownerUserId: string;
  type: ShareType;
  resourceId: string;
  displayName: string;
  mimeType?: string;
  sizeBytes?: number;
  s3Key?: string;
}): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: familyPK(),
        SK: resourceSK(params.type, params.resourceId),
        ownerUserId: params.ownerUserId,
        type: params.type,
        resourceId: params.resourceId,
        displayName: params.displayName,
        ...(params.mimeType ? { mimeType: params.mimeType } : {}),
        ...(params.sizeBytes !== undefined ? { sizeBytes: params.sizeBytes } : {}),
        ...(params.s3Key ? { s3Key: params.s3Key } : {}),
        sharedAt: new Date().toISOString(),
      },
    })
  );
}

export async function removeFamilyShare(type: ShareType, resourceId: string): Promise<void> {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: familyPK(), SK: resourceSK(type, resourceId) },
    })
  );
}

export async function getFamilyShare(
  type: ShareType,
  resourceId: string
): Promise<ShareRecord | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: familyPK(), SK: resourceSK(type, resourceId) },
    })
  );
  return result.Item ? (result.Item as ShareRecord) : null;
}

export async function listAllFamilyShares(): Promise<ShareRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": familyPK() },
    })
  );
  return (result.Items ?? []) as ShareRecord[];
}

// ── Per-user shares ───────────────────────────────────────────────────────────
// PK: SHARE#USER#<targetUserId>  SK: FILE#<id> | FOLDER#<id>

function userPK(targetUserId: string) { return `SHARE#USER#${targetUserId}`; }

export async function createUserShare(params: {
  ownerUserId: string;
  targetUserId: string;
  type: ShareType;
  resourceId: string;
  displayName: string;
  mimeType?: string;
  sizeBytes?: number;
  s3Key?: string;
}): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: userPK(params.targetUserId),
        SK: resourceSK(params.type, params.resourceId),
        ownerUserId: params.ownerUserId,
        targetUserId: params.targetUserId,
        type: params.type,
        resourceId: params.resourceId,
        displayName: params.displayName,
        ...(params.mimeType ? { mimeType: params.mimeType } : {}),
        ...(params.sizeBytes !== undefined ? { sizeBytes: params.sizeBytes } : {}),
        ...(params.s3Key ? { s3Key: params.s3Key } : {}),
        sharedAt: new Date().toISOString(),
      },
    })
  );
}

export async function removeUserShare(
  targetUserId: string,
  type: ShareType,
  resourceId: string
): Promise<void> {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPK(targetUserId), SK: resourceSK(type, resourceId) },
    })
  );
}

export async function getUserShare(
  targetUserId: string,
  type: ShareType,
  resourceId: string
): Promise<ShareRecord | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPK(targetUserId), SK: resourceSK(type, resourceId) },
    })
  );
  return result.Item ? (result.Item as ShareRecord) : null;
}

export async function listSharesWithMe(myUserId: string): Promise<ShareRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": userPK(myUserId) },
    })
  );
  return (result.Items ?? []) as ShareRecord[];
}

/** Returns the list of userIds this resource has been explicitly shared with. */
export async function listExplicitShareTargets(
  type: ShareType,
  resourceId: string
): Promise<string[]> {
  // Scan across all SHARE#USER#* keys for this resource.
  // Family-scale: few users, acceptable.
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "SK = :sk",
      FilterExpression: "begins_with(PK, :prefix)",
      IndexName: undefined, // base table scan via SK... not efficient but OK for 10 users
      ExpressionAttributeValues: {
        ":sk": resourceSK(type, resourceId),
        ":prefix": "SHARE#USER#",
      },
    })
  );
  // Fall back to client-side filter since we can't query non-key attrs efficiently.
  return ((result.Items ?? []) as Array<{ PK: string; targetUserId?: string }>)
    .filter((item) => item.PK.startsWith("SHARE#USER#"))
    .map((item) => item.targetUserId ?? item.PK.replace("SHARE#USER#", ""));
}
