import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";

export interface Folder {
  id: string;
  ownerUserId: string;
  parentFolderId: string | null;
  name: string;
  isRoot: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export async function getFolderById(
  userId: string,
  folderId: string
): Promise<Folder | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `FOLDER#${folderId}` },
    })
  );
  return result.Item ? itemToFolder(result.Item) : null;
}

export async function createFolder(params: {
  ownerUserId: string;
  name: string;
  parentFolderId: string | null;
  isRoot?: boolean;
}): Promise<Folder> {
  const now = new Date().toISOString();
  const folderId = ulid();
  const item = {
    PK: `USER#${params.ownerUserId}`,
    SK: `FOLDER#${folderId}`,
    id: folderId,
    ownerUserId: params.ownerUserId,
    parentFolderId: params.parentFolderId ?? null,
    name: params.name,
    isRoot: params.isRoot ?? false,
    createdAt: now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return itemToFolder(item);
}

export async function getOrCreateRootFolder(userId: string): Promise<Folder> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      FilterExpression: "isRoot = :true",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":prefix": "FOLDER#",
        ":true": true,
      },
    })
  );

  if (result.Items && result.Items.length > 0) {
    return itemToFolder(result.Items[0]);
  }

  return createFolder({
    ownerUserId: userId,
    name: "root",
    parentFolderId: null,
    isRoot: true,
  });
}

export async function listSubFolders(
  userId: string,
  parentFolderId: string
): Promise<Folder[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      FilterExpression:
        "parentFolderId = :parent AND attribute_not_exists(deletedAt)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":prefix": "FOLDER#",
        ":parent": parentFolderId,
      },
    })
  );
  return (result.Items ?? []).map(itemToFolder);
}

export async function listAllFolders(userId: string): Promise<Folder[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      FilterExpression: "attribute_not_exists(deletedAt)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":prefix": "FOLDER#",
      },
    })
  );
  return (result.Items ?? []).map(itemToFolder);
}

export async function getFolderPath(
  userId: string,
  folderId: string
): Promise<Folder[]> {
  const path: Folder[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder = await getFolderById(userId, currentId);
    if (!folder || folder.isRoot) break;
    path.unshift(folder);
    currentId = folder.parentFolderId;
  }

  return path;
}

export async function renameFolder(
  userId: string,
  folderId: string,
  newName: string
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `FOLDER#${folderId}` },
      UpdateExpression: "SET #name = :name, updatedAt = :now",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: {
        ":name": newName,
        ":now": new Date().toISOString(),
      },
    })
  );
}

function itemToFolder(item: Record<string, unknown>): Folder {
  return {
    id: item.id as string,
    ownerUserId: item.ownerUserId as string,
    parentFolderId: (item.parentFolderId as string | null) ?? null,
    name: item.name as string,
    isRoot: item.isRoot as boolean,
    createdAt: item.createdAt as string,
    updatedAt: item.updatedAt as string,
    ...(item.deletedAt ? { deletedAt: item.deletedAt as string } : {}),
  };
}
