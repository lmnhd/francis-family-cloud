import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
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

const FOLDER_LOOKUP_PARENT_ROOT = "ROOT";

function normalizeFolderName(name: string): string {
  return name.trim().toLowerCase();
}

function buildFolderLookupKey(
  parentFolderId: string | null,
  name: string
): string {
  const parentKey = parentFolderId ?? FOLDER_LOOKUP_PARENT_ROOT;
  return `FOLDERLOOKUP#PARENT#${parentKey}#NAME#${normalizeFolderName(name)}`;
}

function isDuplicateFolderClaimError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ConditionalCheckFailedException" ||
    error.name === "TransactionCanceledException"
  );
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
  const folderItem = {
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
  const lookupItem = {
    PK: `USER#${params.ownerUserId}`,
    SK: buildFolderLookupKey(params.parentFolderId ?? null, params.name),
    folderId,
    ownerUserId: params.ownerUserId,
    parentFolderId: params.parentFolderId ?? null,
    name: params.name,
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE_NAME,
            Item: folderItem,
          },
        },
        {
          Put: {
            TableName: TABLE_NAME,
            Item: lookupItem,
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
          },
        },
      ],
    })
  );

  return itemToFolder(folderItem);
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

  try {
    return await createFolder({
      ownerUserId: userId,
      name: "root",
      parentFolderId: null,
      isRoot: true,
    });
  } catch (error) {
    if (!isDuplicateFolderClaimError(error)) {
      throw error;
    }

    const retry = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: buildFolderLookupKey(null, "root"),
        },
        ConsistentRead: true,
      })
    );

    if (retry.Item) {
      return getFolderById(userId, retry.Item.folderId as string).then((folder) => {
        if (!folder) throw error;
        return folder;
      });
    }

    throw error;
  }
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
  parentFolderId: string | null,
  name: string
): Promise<Folder | null> {
  const lookup = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: buildFolderLookupKey(parentFolderId, name),
      },
      ConsistentRead: true,
    })
  );

  if (!lookup.Item) return null;

  return getFolderById(userId, lookup.Item.folderId as string);
}

export async function ensureFolderPath(params: {
  ownerUserId: string;
  parentFolderId: string;
  pathSegments: string[];
}): Promise<Folder> {
  let parent = await getFolderById(params.ownerUserId, params.parentFolderId);
  if (!parent) throw new Error("Parent folder not found");

  for (const segment of params.pathSegments) {
    const existing = await findSubFolderByName(
      params.ownerUserId,
      parent.id,
      segment
    );
    if (existing) {
      parent = existing;
      continue;
    }

    try {
      parent = await createFolder({
        ownerUserId: params.ownerUserId,
        parentFolderId: parent.id,
        name: segment,
      });
    } catch (error) {
      if (!isDuplicateFolderClaimError(error)) {
        throw error;
      }

      const retry = await findSubFolderByName(
        params.ownerUserId,
        parent.id,
        segment
      );
      if (!retry) throw error;
      parent = retry;
    }
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
  const folder = await getFolderById(userId, folderId);
  if (!folder) throw new Error("Folder not found");

  const trimmedName = newName.trim();
  const currentNormalized = normalizeFolderName(folder.name);
  const nextNormalized = normalizeFolderName(trimmedName);
  const now = new Date().toISOString();
  const oldLookupKey = buildFolderLookupKey(folder.parentFolderId, folder.name);
  const newLookupKey = buildFolderLookupKey(folder.parentFolderId, trimmedName);

  if (currentNormalized !== nextNormalized) {
    const conflict = await findSubFolderByName(
      userId,
      folder.parentFolderId,
      trimmedName
    );
    if (conflict && conflict.id !== folderId) {
      throw new Error("A folder with that name already exists");
    }
  }

  if (oldLookupKey === newLookupKey) {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: TABLE_NAME,
              Key: { PK: `USER#${userId}`, SK: `FOLDER#${folderId}` },
              UpdateExpression: "SET #name = :name, updatedAt = :now",
              ExpressionAttributeNames: { "#name": "name" },
              ExpressionAttributeValues: {
                ":name": trimmedName,
                ":now": now,
              },
            },
          },
          {
            Update: {
              TableName: TABLE_NAME,
              Key: { PK: `USER#${userId}`, SK: oldLookupKey },
              UpdateExpression: "SET #name = :name, updatedAt = :now",
              ExpressionAttributeNames: { "#name": "name" },
              ExpressionAttributeValues: {
                ":name": trimmedName,
                ":now": now,
              },
            },
          },
        ],
      })
    );
    return;
  }

  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: TABLE_NAME,
            Key: { PK: `USER#${userId}`, SK: oldLookupKey },
          },
        },
        {
          Update: {
            TableName: TABLE_NAME,
            Key: { PK: `USER#${userId}`, SK: `FOLDER#${folderId}` },
            UpdateExpression: "SET #name = :name, updatedAt = :now",
            ExpressionAttributeNames: { "#name": "name" },
            ExpressionAttributeValues: {
              ":name": trimmedName,
              ":now": now,
            },
          },
        },
        {
          Put: {
            TableName: TABLE_NAME,
            Item: {
              PK: `USER#${userId}`,
              SK: newLookupKey,
              folderId,
              ownerUserId: userId,
              parentFolderId: folder.parentFolderId,
              name: trimmedName,
              createdAt: folder.createdAt,
              updatedAt: now,
            },
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
          },
        },
      ],
    })
  );
}

export async function deleteFolderTree(
  userId: string,
  folderId: string
): Promise<{ fileCount: number; folderCount: number }> {
  const folder = await getFolderById(userId, folderId);
  if (!folder || folder.isRoot) throw new Error("Folder not found");

  const foldersToDelete: Folder[] = [];
  const fileIds: string[] = [];
  const s3Objects: Array<{ s3Key: string }> = [];

  async function walk(currentFolderId: string): Promise<void> {
    const currentFolder = await getFolderById(userId, currentFolderId);
    if (!currentFolder) return;
    foldersToDelete.push(currentFolder);

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

  for (const currentFolder of foldersToDelete.reverse()) {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: TABLE_NAME,
              Key: { PK: `USER#${userId}`, SK: `FOLDER#${currentFolder.id}` },
            },
          },
          {
            Delete: {
              TableName: TABLE_NAME,
              Key: {
                PK: `USER#${userId}`,
                SK: buildFolderLookupKey(
                  currentFolder.parentFolderId,
                  currentFolder.name
                ),
              },
            },
          },
        ],
      })
    );
  }

  return { fileCount: fileIds.length, folderCount: foldersToDelete.length };
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
