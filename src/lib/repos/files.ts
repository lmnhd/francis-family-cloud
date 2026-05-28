import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";

export interface FileRecord {
  id: string;
  ownerUserId: string;
  folderId: string;
  originalName: string;
  displayName: string;
  s3Bucket: string;
  s3Key: string;
  etag?: string;
  status: "pending_upload" | "available" | "deleted" | "failed";
  source: "manual_upload";
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export function buildS3Key(
  userId: string,
  fileId: string,
  fileName: string
): string {
  const safeName = fileName.replace(/[^\w.\-]/g, "_");
  return `family-cloud/users/${userId}/objects/${fileId}/${safeName}`;
}

export async function createFilePending(params: {
  fileId?: string;
  ownerUserId: string;
  folderId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  s3Bucket: string;
  s3Key: string;
}): Promise<FileRecord> {
  const now = new Date().toISOString();
  const fileId = params.fileId ?? ulid();
  const item = {
    PK: `USER#${params.ownerUserId}`,
    SK: `FILE#${fileId}`,
    id: fileId,
    ownerUserId: params.ownerUserId,
    folderId: params.folderId,
    originalName: params.fileName,
    displayName: params.fileName,
    s3Bucket: params.s3Bucket,
    s3Key: params.s3Key,
    status: "pending_upload",
    source: "manual_upload",
    sizeBytes: params.sizeBytes,
    mimeType: params.mimeType,
    createdAt: now,
    updatedAt: now,
    GSI2PK: `USER#${params.ownerUserId}#FOLDER#${params.folderId}`,
    GSI2SK: params.fileName.toLowerCase(),
    GSI3PK: `USER#${params.ownerUserId}#STATUS#pending_upload`,
    GSI3SK: now,
  };
  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return itemToFile(item);
}

export async function completeFileUpload(params: {
  ownerUserId: string;
  fileId: string;
  sizeBytes: number;
  etag: string;
}): Promise<void> {
  const now = new Date().toISOString();
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${params.ownerUserId}`,
        SK: `FILE#${params.fileId}`,
      },
      UpdateExpression:
        "SET #status = :status, sizeBytes = :size, etag = :etag, updatedAt = :now, GSI3PK = :gsi3pk, GSI3SK = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "available",
        ":size": params.sizeBytes,
        ":etag": params.etag,
        ":now": now,
        ":gsi3pk": `USER#${params.ownerUserId}#STATUS#available`,
      },
    })
  );
}

export async function getFileById(
  userId: string,
  fileId: string
): Promise<FileRecord | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `FILE#${fileId}` },
    })
  );
  return result.Item ? itemToFile(result.Item) : null;
}

export async function listFilesInFolder(
  userId: string,
  folderId: string
): Promise<FileRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "byFolder",
      KeyConditionExpression: "GSI2PK = :pk",
      FilterExpression: "#status <> :deleted",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}#FOLDER#${folderId}`,
        ":deleted": "deleted",
      },
    })
  );
  return (result.Items ?? []).map(itemToFile);
}

export async function listTrashedFiles(userId: string): Promise<FileRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "byFileStatus",
      KeyConditionExpression: "GSI3PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}#STATUS#deleted`,
      },
      ScanIndexForward: false,
    })
  );
  return (result.Items ?? []).map(itemToFile);
}

export async function searchFilesInFolder(
  userId: string,
  folderId: string,
  prefix: string
): Promise<FileRecord[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "byFolder",
      KeyConditionExpression:
        "GSI2PK = :pk AND begins_with(GSI2SK, :prefix)",
      FilterExpression: "#status <> :deleted",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}#FOLDER#${folderId}`,
        ":prefix": prefix.toLowerCase(),
        ":deleted": "deleted",
      },
    })
  );
  return (result.Items ?? []).map(itemToFile);
}

export async function moveFile(
  userId: string,
  fileId: string,
  newFolderId: string
): Promise<void> {
  const file = await getFileById(userId, fileId);
  if (!file) throw new Error("File not found");

  const now = new Date().toISOString();
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `FILE#${fileId}` },
      UpdateExpression:
        "SET folderId = :fid, GSI2PK = :gsi2pk, updatedAt = :now",
      ExpressionAttributeValues: {
        ":fid": newFolderId,
        ":gsi2pk": `USER#${userId}#FOLDER#${newFolderId}`,
        ":now": now,
      },
    })
  );
}

export async function renameFile(
  userId: string,
  fileId: string,
  newName: string
): Promise<void> {
  const now = new Date().toISOString();
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `FILE#${fileId}` },
      UpdateExpression:
        "SET displayName = :name, GSI2SK = :nameLower, updatedAt = :now",
      ExpressionAttributeValues: {
        ":name": newName,
        ":nameLower": newName.toLowerCase(),
        ":now": now,
      },
    })
  );
}

export async function softDeleteFile(
  userId: string,
  fileId: string
): Promise<void> {
  const now = new Date().toISOString();
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `FILE#${fileId}` },
      UpdateExpression:
        "SET #status = :deleted, deletedAt = :now, updatedAt = :now, GSI3PK = :gsi3pk, GSI3SK = :now",
      ConditionExpression: "#status <> :deleted",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":deleted": "deleted",
        ":now": now,
        ":gsi3pk": `USER#${userId}#STATUS#deleted`,
      },
    })
  );
}

export async function restoreFile(
  userId: string,
  fileId: string
): Promise<void> {
  const now = new Date().toISOString();
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `FILE#${fileId}` },
      UpdateExpression:
        "SET #status = :available, updatedAt = :now, GSI3PK = :gsi3pk, GSI3SK = :now REMOVE deletedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":available": "available",
        ":now": now,
        ":gsi3pk": `USER#${userId}#STATUS#available`,
      },
    })
  );
}

export async function listExpiredTrashFiles(
  olderThanDays = 30
): Promise<FileRecord[]> {
  const cutoff = new Date(
    Date.now() - olderThanDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const result = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "#status = :deleted AND deletedAt < :cutoff",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":deleted": "deleted", ":cutoff": cutoff },
    })
  );
  return (result.Items ?? []).map(itemToFile);
}

export async function permanentlyDeleteFile(
  userId: string,
  fileId: string
): Promise<void> {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `FILE#${fileId}` },
    })
  );
}

export async function getUserStorageBytes(userId: string): Promise<number> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "byFileStatus",
      KeyConditionExpression: "GSI3PK = :pk",
      ProjectionExpression: "sizeBytes",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}#STATUS#available`,
      },
    })
  );
  return (result.Items ?? []).reduce(
    (sum, item) => sum + ((item.sizeBytes as number) || 0),
    0
  );
}

function itemToFile(item: Record<string, unknown>): FileRecord {
  return {
    id: item.id as string,
    ownerUserId: item.ownerUserId as string,
    folderId: item.folderId as string,
    originalName: item.originalName as string,
    displayName: item.displayName as string,
    s3Bucket: item.s3Bucket as string,
    s3Key: item.s3Key as string,
    status: item.status as FileRecord["status"],
    source: "manual_upload",
    sizeBytes: item.sizeBytes as number,
    mimeType: item.mimeType as string,
    createdAt: item.createdAt as string,
    updatedAt: item.updatedAt as string,
    ...(item.etag ? { etag: item.etag as string } : {}),
    ...(item.deletedAt ? { deletedAt: item.deletedAt as string } : {}),
  };
}
