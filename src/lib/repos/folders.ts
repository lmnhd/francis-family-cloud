import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";
import {
  deleteFileObject,
  permanentlyDeleteFile,
  listAllFilesInFolder,
} from "@/lib/repos/files";

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

export async function findSubFolderByName(
  userId: string,
  parentFolderId: string,
  name: string
): Promise<Folder | null> {
  const normalized = name.trim().toLowerCase();
  const folders = await listSubFolders(userId, parentFolderId);
  return folders.find((folder) => folder.name.toLowerCase() === normalized) ?? null;
}

export async function ensureFolderPath(params: {
  ownerUserId: string;
  parentFolderId: string;
  pathSegments: string[];
}): Promise<Folder> {
  let parent = await getFolderById(params.ownerUserId, params.parentFolderId);
  if (!parent) throw new Error("Parent folder not found");

  for (const segment of params.pathSegments) {
    const existing = await findSubFolderByName(params.ownerUserId, parent.id, segment);
    parent =
      existing ??
      (await createFolder({
        ownerUserId: params.ownerUserId,
        parentFolderId: parent.id,
        name: segment,
      }));
  }

  return parent;
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

  // Start from the *parent* of the target folder so the target itself
  // is not included in the ancestor list (it becomes the page title).
  const current = await getFolderById(userId, folderId);
  if (!current) return [];

  let currentId: string | null = current.parentFolderId;

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

export async function deleteFolderTree(
  userId: string,
  folderId: string
): Promise<{ fileCount: number; folderCount: number }> {
  const folder = await getFolderById(userId, folderId);
  if (!folder || folder.isRoot) throw new Error("Folder not found");

  const folderIds: string[] = [];
  const fileIds: string[] = [];
  const s3Objects: Array<{ s3Key: string }> = [];

  async function walk(currentFolderId: string): Promise<void> {
    folderIds.push(currentFolderId);

    const files = await listAllFilesInFolder(userId, currentFolderId);
    for (const file of files) {
      fileIds.push(file.id);
      s3Objects.push({ s3Key: file.s3Key });
    }

    const childFolders = await listSubFolders(userId, currentFolderId);
    for (const child of childFolders) {
      await walk(child.id);
    }
  }

  await walk(folderId);

  for (const { s3Key } of s3Objects) {
    await deleteFileObject(s3Key);
  }

  for (const fileId of fileIds) {
    await permanentlyDeleteFile(userId, fileId);
  }

  for (const id of folderIds.reverse()) {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: `FOLDER#${id}` },
      })
    );
  }

  return { fileCount: fileIds.length, folderCount: folderIds.length };
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
